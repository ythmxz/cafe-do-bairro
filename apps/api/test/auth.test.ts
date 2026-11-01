import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  type App,
  authHeaders,
  buildOrder,
  daysFromToday,
  prisma,
  resetDatabase,
  startApp,
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

describe("rotas da Dona Marta (protegidas)", () => {
  it.each([
    ["GET", "/encomendas"],
    ["PATCH", "/encomendas/1"],
    ["DELETE", "/encomendas/1"],
  ] as const)("%s %s sem senha devolve 401", async (method, url) => {
    const res = await app.inject({ method, url });

    expect(res.statusCode).toBe(401);
  });

  it("senha errada devolve 401", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/encomendas",
      headers: { authorization: "Bearer senha-errada" },
    });

    expect(res.statusCode).toBe(401);
  });

  it("senha certa deixa passar", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/encomendas",
      headers: authHeaders,
    });

    expect(res.statusCode).toBe(200);
  });

  it("confere a senha antes de validar o corpo (401, não 400)", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: "/encomendas/1",
      payload: {},
    });

    expect(res.statusCode).toBe(401);
  });

  it("não vaza dados de clientes na resposta de erro", async () => {
    await app.inject({
      method: "POST",
      url: "/encomendas",
      payload: buildOrder(),
    });

    const res = await app.inject({ method: "GET", url: "/encomendas" });

    expect(res.body).not.toContain("73999999999");
  });
});

describe("rotas do cliente (públicas)", () => {
  it("criar encomenda não exige senha", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/encomendas",
      payload: buildOrder(),
    });

    expect(res.statusCode).toBe(201);
  });

  it("consultar disponibilidade não exige senha", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/disponibilidade?data=${daysFromToday(10)}`,
    });

    expect(res.statusCode).toBe(200);
  });

  it("a disponibilidade devolve só contagens, nunca dados de clientes", async () => {
    await app.inject({
      method: "POST",
      url: "/encomendas",
      payload: buildOrder(),
    });

    const res = await app.inject({
      method: "GET",
      url: `/disponibilidade?data=${daysFromToday(10)}`,
    });

    expect(Object.keys(res.json()).sort()).toEqual([
      "data",
      "disponivel",
      "limite",
      "ocupadas",
      "vagas",
    ]);
  });
});
