import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  authHeaders,
  buildOrder,
  daysFromToday,
  prisma,
  resetDatabase,
  startApp,
  type App,
} from "./helpers";

let app: App;

beforeAll(async () => {
  app = await startApp();
});

afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

beforeEach(resetDatabase);

const targetDay = daysFromToday(20);

function createOrderOn(date: string, customer = "Cliente") {
  return app.inject({
    method: "POST",
    url: "/encomendas",
    payload: buildOrder({ dataEntrega: date, cliente: customer }),
  });
}

async function fillDay(date: string): Promise<number[]> {
  const ids: number[] = [];
  for (let i = 1; i <= 5; i++) {
    ids.push((await createOrderOn(date, `Cliente ${i}`)).json().id);
  }
  return ids;
}

function updateOrder(id: number, body: object) {
  return app.inject({
    method: "PATCH",
    url: `/encomendas/${id}`,
    headers: authHeaders,
    payload: body,
  });
}

describe("limite de 5 encomendas por dia", () => {
  it("aceita 5 e recusa a 6a com 409", async () => {
    await fillDay(targetDay);

    const sixth = await createOrderOn(targetDay, "Sexta");

    expect(sixth.statusCode).toBe(409);
    expect(sixth.json().erro).toContain("5 encomendas");
  });

  it("a encomenda recusada não é gravada", async () => {
    await fillDay(targetDay);
    await createOrderOn(targetDay, "Sexta");

    expect(await prisma.order.count()).toBe(5);
  });

  it("outros dias continuam livres", async () => {
    await fillDay(targetDay);

    const res = await createOrderOn(daysFromToday(21));

    expect(res.statusCode).toBe(201);
  });

  it("a disponibilidade acompanha as vagas", async () => {
    const checkAvailability = async () =>
      (
        await app.inject({
          method: "GET",
          url: `/disponibilidade?data=${targetDay}`,
        })
      ).json();

    expect(await checkAvailability()).toMatchObject({
      ocupadas: 0,
      vagas: 5,
      disponivel: true,
    });

    await createOrderOn(targetDay);
    await createOrderOn(targetDay);
    expect(await checkAvailability()).toMatchObject({
      ocupadas: 2,
      vagas: 3,
      disponivel: true,
    });

    await createOrderOn(targetDay);
    await createOrderOn(targetDay);
    await createOrderOn(targetDay);
    expect(await checkAvailability()).toMatchObject({
      ocupadas: 5,
      vagas: 0,
      disponivel: false,
    });
  });

  it("recusa uma data de disponibilidade inválida (400)", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/disponibilidade?data=amanha",
    });

    expect(res.statusCode).toBe(400);
  });
});

describe("o limite não pode travar a edição normal", () => {
  it("mudar o status de uma encomenda em dia lotado funciona", async () => {
    const [id] = await fillDay(targetDay);

    const res = await updateOrder(id!, { status: "PREPARO" });

    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe("PREPARO");
  });

  it("reenviar a mesma data em dia lotado funciona", async () => {
    const [id] = await fillDay(targetDay);

    const res = await updateOrder(id!, {
      dataEntrega: targetDay,
      produto: "Bolo de fubá",
    });

    expect(res.statusCode).toBe(200);
  });
});

describe("mover encomendas entre dias", () => {
  it("mover para um dia lotado dá 409 e a encomenda fica onde estava", async () => {
    await fillDay(targetDay);
    const otherDate = daysFromToday(22);
    const { id } = (await createOrderOn(otherDate, "Outra")).json();

    const res = await updateOrder(id, { dataEntrega: targetDay });

    expect(res.statusCode).toBe(409);
    const stored = await prisma.order.findUnique({ where: { id } });
    expect(stored?.deliveryDate.toISOString().slice(0, 10)).toBe(otherDate);
  });

  it("mover para um dia livre funciona e libera a vaga do dia antigo", async () => {
    const ids = await fillDay(targetDay);
    const freeDate = daysFromToday(23);

    const res = await updateOrder(ids[0]!, { dataEntrega: freeDate });
    const availability = await app.inject({
      method: "GET",
      url: `/disponibilidade?data=${targetDay}`,
    });

    expect(res.statusCode).toBe(200);
    expect(availability.json()).toMatchObject({ ocupadas: 4, vagas: 1 });
  });
});

describe("pedidos simultâneos", () => {
  it("nunca passam de 5, mesmo chegando todos ao mesmo tempo", async () => {
    const responses = await Promise.all(
      Array.from({ length: 8 }, (_, i) =>
        createOrderOn(targetDay, `Corrida ${i + 1}`),
      ),
    );

    const codes = responses.map((r) => r.statusCode);
    expect(codes.filter((c) => c === 201)).toHaveLength(5);
    expect(codes.filter((c) => c === 409)).toHaveLength(3);
    expect(await prisma.order.count()).toBe(5);
  });
});

describe("limite de requisições no POST público", () => {
  it("passado de 20 pedidos por minuto, devolve 429 em português", async () => {
    const limitedApp = await startApp({ rateLimit: true });

    try {
      const codes: number[] = [];
      let lastBody: { erro?: string } = {};

      for (let i = 0; i < 21; i++) {
        const res = await limitedApp.inject({
          method: "POST",
          url: "/encomendas",
          payload: {},
        });
        codes.push(res.statusCode);
        lastBody = res.json();
      }

      expect(codes.slice(0, 20).every((c) => c === 400)).toBe(true);
      expect(codes[20]).toBe(429);
      expect(lastBody.erro).toContain("Muitas tentativas");
    } finally {
      await limitedApp.close();
    }
  });
});
