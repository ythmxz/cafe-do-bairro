import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { LIMITE_DIARIO } from "@cafe/shared";
import { disponibilidadeRoutes } from "./disponibilidade";
import { encomendasRoutes } from "./encomendas";
import { ErroHttp } from "./erros";

function statusDoErro(erro: unknown): number {
  if (
    typeof erro === "object" &&
    erro !== null &&
    "statusCode" in erro &&
    typeof erro.statusCode === "number"
  ) {
    return erro.statusCode;
  }
  return 500;
}

function mensagemDoErro(erro: unknown): string {
  return erro instanceof Error ? erro.message : "Requisição inválida";
}

export function buildApp() {
  const app = Fastify({ logger: true });

  app.register(cors, {
    origin: process.env.WEB_URL ?? "http://localhost:3000",
    methods: ["GET", "POST", "PATCH", "DELETE"],
  });

  app.register(rateLimit, { global: false });

  app.setErrorHandler((erro, _req, reply) => {
    if (erro instanceof ErroHttp) {
      return reply
        .code(erro.status)
        .send({ erro: erro.message, detalhes: erro.detalhes });
    }

    const status = statusDoErro(erro);
    if (status >= 500) app.log.error(erro);

    return reply.code(status).send({
      erro: status >= 500 ? "Erro interno do servidor" : mensagemDoErro(erro),
    });
  });

  app.get("/saude", async () => ({ ok: true, limiteDiario: LIMITE_DIARIO }));

  app.register(encomendasRoutes, { prefix: "/encomendas" });
  app.register(disponibilidadeRoutes, { prefix: "/disponibilidade" });

  return app;
}
