import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  authHeaders,
  buildOrder,
  daysFromToday,
  prisma,
  resetDatabase,
  startApp,
  type App,
  type OrderBody,
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

function createOrder(body: object = buildOrder()) {
  return app.inject({ method: "POST", url: "/encomendas", payload: body });
}

function updateOrder(id: number, body: object) {
  return app.inject({
    method: "PATCH",
    url: `/encomendas/${id}`,
    headers: authHeaders,
    payload: body,
  });
}

describe("criar encomenda", () => {
  it("cria, limpa o telefone e começa como RECEBIDA", async () => {
    const res = await createOrder();

    expect(res.statusCode).toBe(201);
    expect(res.json()).toMatchObject({
      cliente: "Maria",
      telefone: "73999999999",
      produto: "Bolo de cenoura",
      dataEntrega: daysFromToday(10),
      status: "RECEBIDA",
    });
  });

  it("recusa um status enviado pelo cliente (400)", async () => {
    const res = await createOrder({ ...buildOrder(), status: "ENTREGUE" });

    expect(res.statusCode).toBe(400);
    expect(await prisma.order.count()).toBe(0);
  });

  it.each<[string, Partial<OrderBody>]>([
    ["telefone curto demais", { telefone: "123" }],
    ["data no passado", { dataEntrega: daysFromToday(-1) }],
    ["data que não existe", { dataEntrega: "2026-02-30" }],
    ["nome só com espaços", { cliente: "   " }],
    ["nome longo demais", { cliente: "A".repeat(101) }],
    ["produto longo demais", { produto: "B".repeat(201) }],
  ])("recusa %s (400) e não grava nada", async (_label, extra) => {
    const res = await createOrder(buildOrder(extra));

    expect(res.statusCode).toBe(400);
    expect(await prisma.order.count()).toBe(0);
  });

  it("recusa um corpo sem os campos obrigatórios (400)", async () => {
    const res = await createOrder({});

    expect(res.statusCode).toBe(400);
    expect(res.json().detalhes.length).toBeGreaterThanOrEqual(4);
  });
});

describe("listar encomendas", () => {
  it("ordena da data mais próxima para a mais distante", async () => {
    await createOrder(
      buildOrder({ cliente: "Longe", dataEntrega: daysFromToday(12) }),
    );
    await createOrder(
      buildOrder({ cliente: "Perto", dataEntrega: daysFromToday(11) }),
    );

    const res = await app.inject({
      method: "GET",
      url: "/encomendas",
      headers: authHeaders,
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().map((o: { cliente: string }) => o.cliente)).toEqual([
      "Perto",
      "Longe",
    ]);
  });

  it("filtra por data", async () => {
    await createOrder(buildOrder({ dataEntrega: daysFromToday(11) }));
    await createOrder(buildOrder({ dataEntrega: daysFromToday(12) }));

    const res = await app.inject({
      method: "GET",
      url: `/encomendas?data=${daysFromToday(11)}`,
      headers: authHeaders,
    });

    expect(res.json()).toHaveLength(1);
    expect(res.json()[0].dataEntrega).toBe(daysFromToday(11));
  });

  it("filtra por status", async () => {
    const first = (await createOrder()).json();
    await createOrder(buildOrder({ cliente: "Outra" }));
    await updateOrder(first.id, { status: "PREPARO" });

    const res = await app.inject({
      method: "GET",
      url: "/encomendas?status=PREPARO",
      headers: authHeaders,
    });

    expect(res.json()).toHaveLength(1);
    expect(res.json()[0].id).toBe(first.id);
  });

  it("recusa um filtro inválido (400)", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/encomendas?status=XX",
      headers: authHeaders,
    });

    expect(res.statusCode).toBe(400);
  });
});

describe("atualizar encomenda", () => {
  it("muda o status", async () => {
    const { id } = (await createOrder()).json();

    const res = await updateOrder(id, { status: "PREPARO" });

    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe("PREPARO");
  });

  it("muda vários campos de uma vez e mantém o resto", async () => {
    const { id } = (await createOrder()).json();

    const res = await updateOrder(id, {
      produto: "Panetone",
      telefone: "(73) 3333-4444",
    });

    expect(res.json()).toMatchObject({
      produto: "Panetone",
      telefone: "7333334444",
      cliente: "Maria",
    });
  });

  it("devolve 404 para uma encomenda que não existe", async () => {
    const res = await updateOrder(999999, { status: "PREPARO" });

    expect(res.statusCode).toBe(404);
  });

  it("recusa um corpo vazio (400)", async () => {
    const { id } = (await createOrder()).json();

    const res = await updateOrder(id, {});

    expect(res.statusCode).toBe(400);
  });

  it("recusa um id que não é número (400)", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: "/encomendas/abc",
      headers: authHeaders,
      payload: { status: "PREPARO" },
    });

    expect(res.statusCode).toBe(400);
  });

  it("recusa mudar a data para o passado (400)", async () => {
    const { id } = (await createOrder()).json();

    const res = await updateOrder(id, { dataEntrega: daysFromToday(-1) });

    expect(res.statusCode).toBe(400);
  });
});

describe("remover encomenda", () => {
  it("remove (204) e depois devolve 404", async () => {
    const { id } = (await createOrder()).json();

    const first = await app.inject({
      method: "DELETE",
      url: `/encomendas/${id}`,
      headers: authHeaders,
    });
    const second = await app.inject({
      method: "DELETE",
      url: `/encomendas/${id}`,
      headers: authHeaders,
    });

    expect(first.statusCode).toBe(204);
    expect(second.statusCode).toBe(404);
    expect(await prisma.order.count()).toBe(0);
  });
});

describe("rotas gerais", () => {
  it("devolve 404 padronizado em português para rota inexistente", async () => {
    const res = await app.inject({ method: "GET", url: "/nao-existe" });

    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({ erro: "Rota não encontrada" });
  });
});
