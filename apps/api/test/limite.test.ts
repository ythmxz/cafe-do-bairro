import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  comSenha,
  diaFuturo,
  iniciarApp,
  limparBanco,
  prisma,
  umaEncomenda,
  type App,
} from "./helpers";

let app: App;

beforeAll(async () => {
  app = await iniciarApp();
});

afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

beforeEach(limparBanco);

const dia = diaFuturo(20);

function criarNoDia(data: string, cliente = "Cliente") {
  return app.inject({
    method: "POST",
    url: "/encomendas",
    payload: umaEncomenda({ dataEntrega: data, cliente }),
  });
}

async function encher(data: string): Promise<number[]> {
  const ids: number[] = [];
  for (let i = 1; i <= 5; i++) {
    ids.push((await criarNoDia(data, `Cliente ${i}`)).json().id);
  }
  return ids;
}

function atualizar(id: number, corpo: object) {
  return app.inject({
    method: "PATCH",
    url: `/encomendas/${id}`,
    headers: comSenha,
    payload: corpo,
  });
}

describe("limite de 5 encomendas por dia", () => {
  it("aceita 5 e recusa a 6a com 409", async () => {
    await encher(dia);

    const sexta = await criarNoDia(dia, "Sexta");

    expect(sexta.statusCode).toBe(409);
    expect(sexta.json().erro).toContain("5 encomendas");
  });

  it("a encomenda recusada não é gravada", async () => {
    await encher(dia);
    await criarNoDia(dia, "Sexta");

    expect(await prisma.encomenda.count()).toBe(5);
  });

  it("outros dias continuam livres", async () => {
    await encher(dia);

    const res = await criarNoDia(diaFuturo(21));

    expect(res.statusCode).toBe(201);
  });

  it("a disponibilidade acompanha as vagas", async () => {
    const consultar = async () =>
      (
        await app.inject({ method: "GET", url: `/disponibilidade?data=${dia}` })
      ).json();

    expect(await consultar()).toMatchObject({
      ocupadas: 0,
      vagas: 5,
      disponivel: true,
    });

    await criarNoDia(dia);
    await criarNoDia(dia);
    expect(await consultar()).toMatchObject({
      ocupadas: 2,
      vagas: 3,
      disponivel: true,
    });

    await criarNoDia(dia);
    await criarNoDia(dia);
    await criarNoDia(dia);
    expect(await consultar()).toMatchObject({
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
    const [id] = await encher(dia);

    const res = await atualizar(id!, { status: "PREPARO" });

    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe("PREPARO");
  });

  it("reenviar a mesma data em dia lotado funciona", async () => {
    const [id] = await encher(dia);

    const res = await atualizar(id!, {
      dataEntrega: dia,
      produto: "Bolo de fubá",
    });

    expect(res.statusCode).toBe(200);
  });
});

describe("mover encomendas entre dias", () => {
  it("mover para um dia lotado dá 409 e a encomenda fica onde estava", async () => {
    await encher(dia);
    const outraData = diaFuturo(22);
    const { id } = (await criarNoDia(outraData, "Outra")).json();

    const res = await atualizar(id, { dataEntrega: dia });

    expect(res.statusCode).toBe(409);
    const naBase = await prisma.encomenda.findUnique({ where: { id } });
    expect(naBase?.dataEntrega.toISOString().slice(0, 10)).toBe(outraData);
  });

  it("mover para um dia livre funciona e libera a vaga do dia antigo", async () => {
    const ids = await encher(dia);
    const livre = diaFuturo(23);

    const res = await atualizar(ids[0]!, { dataEntrega: livre });
    const vagas = await app.inject({
      method: "GET",
      url: `/disponibilidade?data=${dia}`,
    });

    expect(res.statusCode).toBe(200);
    expect(vagas.json()).toMatchObject({ ocupadas: 4, vagas: 1 });
  });
});

describe("pedidos simultâneos", () => {
  it("nunca passam de 5, mesmo chegando todos ao mesmo tempo", async () => {
    const respostas = await Promise.all(
      Array.from({ length: 8 }, (_, i) => criarNoDia(dia, `Corrida ${i + 1}`)),
    );

    const codigos = respostas.map((r) => r.statusCode);
    expect(codigos.filter((c) => c === 201)).toHaveLength(5);
    expect(codigos.filter((c) => c === 409)).toHaveLength(3);
    expect(await prisma.encomenda.count()).toBe(5);
  });
});

describe("limite de requisições no POST público", () => {
  it("passado de 20 pedidos por minuto, devolve 429", async () => {
    const limitado = await iniciarApp({ limitarRequisicoes: true });

    try {
      const codigos: number[] = [];
      for (let i = 0; i < 21; i++) {
        const res = await limitado.inject({
          method: "POST",
          url: "/encomendas",
          payload: {},
        });
        codigos.push(res.statusCode);
      }

      expect(codigos.slice(0, 20).every((c) => c === 400)).toBe(true);
      expect(codigos[20]).toBe(429);
    } finally {
      await limitado.close();
    }
  });
});
