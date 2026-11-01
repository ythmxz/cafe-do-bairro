import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  comSenha,
  diaFuturo,
  iniciarApp,
  limparBanco,
  prisma,
  umaEncomenda,
  type App,
  type CorpoEncomenda,
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

function criar(corpo: object = umaEncomenda()) {
  return app.inject({ method: "POST", url: "/encomendas", payload: corpo });
}

function atualizar(id: number, corpo: object) {
  return app.inject({
    method: "PATCH",
    url: `/encomendas/${id}`,
    headers: comSenha,
    payload: corpo,
  });
}

describe("criar encomenda", () => {
  it("cria, limpa o telefone e começa como RECEBIDA", async () => {
    const res = await criar();

    expect(res.statusCode).toBe(201);
    expect(res.json()).toMatchObject({
      cliente: "Maria",
      telefone: "73999999999",
      produto: "Bolo de cenoura",
      dataEntrega: diaFuturo(10),
      status: "RECEBIDA",
    });
  });

  it("recusa um status enviado pelo cliente (400)", async () => {
    const res = await criar({ ...umaEncomenda(), status: "ENTREGUE" });

    expect(res.statusCode).toBe(400);
    expect(await prisma.encomenda.count()).toBe(0);
  });

  it.each<[string, Partial<CorpoEncomenda>]>([
    ["telefone curto demais", { telefone: "123" }],
    ["data no passado", { dataEntrega: diaFuturo(-1) }],
    ["data que não existe", { dataEntrega: "2026-02-30" }],
    ["nome só com espaços", { cliente: "   " }],
  ])("recusa %s (400) e não grava nada", async (_nome, extra) => {
    const res = await criar(umaEncomenda(extra));

    expect(res.statusCode).toBe(400);
    expect(await prisma.encomenda.count()).toBe(0);
  });

  it("recusa um corpo sem os campos obrigatórios (400)", async () => {
    const res = await criar({});

    expect(res.statusCode).toBe(400);
    expect(res.json().detalhes.length).toBeGreaterThanOrEqual(4);
  });
});

describe("listar encomendas", () => {
  it("ordena da data mais próxima para a mais distante", async () => {
    await criar(umaEncomenda({ cliente: "Longe", dataEntrega: diaFuturo(12) }));
    await criar(umaEncomenda({ cliente: "Perto", dataEntrega: diaFuturo(11) }));

    const res = await app.inject({
      method: "GET",
      url: "/encomendas",
      headers: comSenha,
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().map((e: { cliente: string }) => e.cliente)).toEqual([
      "Perto",
      "Longe",
    ]);
  });

  it("filtra por data", async () => {
    await criar(umaEncomenda({ dataEntrega: diaFuturo(11) }));
    await criar(umaEncomenda({ dataEntrega: diaFuturo(12) }));

    const res = await app.inject({
      method: "GET",
      url: `/encomendas?data=${diaFuturo(11)}`,
      headers: comSenha,
    });

    expect(res.json()).toHaveLength(1);
    expect(res.json()[0].dataEntrega).toBe(diaFuturo(11));
  });

  it("filtra por status", async () => {
    const primeira = (await criar()).json();
    await criar(umaEncomenda({ cliente: "Outra" }));
    await atualizar(primeira.id, { status: "PREPARO" });

    const res = await app.inject({
      method: "GET",
      url: "/encomendas?status=PREPARO",
      headers: comSenha,
    });

    expect(res.json()).toHaveLength(1);
    expect(res.json()[0].id).toBe(primeira.id);
  });

  it("recusa um filtro inválido (400)", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/encomendas?status=XX",
      headers: comSenha,
    });

    expect(res.statusCode).toBe(400);
  });
});

describe("atualizar encomenda", () => {
  it("muda o status", async () => {
    const { id } = (await criar()).json();

    const res = await atualizar(id, { status: "PREPARO" });

    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe("PREPARO");
  });

  it("muda vários campos de uma vez e mantém o resto", async () => {
    const { id } = (await criar()).json();

    const res = await atualizar(id, {
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
    const res = await atualizar(999999, { status: "PREPARO" });

    expect(res.statusCode).toBe(404);
  });

  it("recusa um corpo vazio (400)", async () => {
    const { id } = (await criar()).json();

    const res = await atualizar(id, {});

    expect(res.statusCode).toBe(400);
  });

  it("recusa um id que não é número (400)", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: "/encomendas/abc",
      headers: comSenha,
      payload: { status: "PREPARO" },
    });

    expect(res.statusCode).toBe(400);
  });

  it("recusa mudar a data para o passado (400)", async () => {
    const { id } = (await criar()).json();

    const res = await atualizar(id, { dataEntrega: diaFuturo(-1) });

    expect(res.statusCode).toBe(400);
  });
});

describe("remover encomenda", () => {
  it("remove (204) e depois devolve 404", async () => {
    const { id } = (await criar()).json();

    const remocao = await app.inject({
      method: "DELETE",
      url: `/encomendas/${id}`,
      headers: comSenha,
    });
    const repetida = await app.inject({
      method: "DELETE",
      url: `/encomendas/${id}`,
      headers: comSenha,
    });

    expect(remocao.statusCode).toBe(204);
    expect(repetida.statusCode).toBe(404);
    expect(await prisma.encomenda.count()).toBe(0);
  });
});
