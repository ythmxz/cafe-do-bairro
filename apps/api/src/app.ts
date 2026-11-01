import Fastify from "fastify";
import cors from "@fastify/cors";
import { LIMITE_DIARIO } from "@cafe/shared";
import { encomendasRoutes } from "./encomendas";
import { ErroHttp } from "./erros";
import { disponibilidadeRoutes } from "./disponibilidade";

export function buildApp() {
  const app = Fastify({ logger: true });

  app.register(cors, {
    origin: process.env.WEB_URL ?? "http://localhost:3000",
    methods: ["GET", "POST", "PATCH", "DELETE"],
  });

  app.setErrorHandler((erro, _req, reply) => {
    if (erro instanceof ErroHttp) {
      return reply
        .code(erro.status)
        .send({ erro: erro.message, detalhes: erro.detalhes });
    }

    const status = erro.statusCode ?? 500;
    if (status >= 500) app.log.error(erro);

    return reply.code(status).send({
      erro: status >= 500 ? "Erro interno do servidor" : erro.message,
    });
  });

  app.get("/saude", async () => ({ ok: true, limiteDiario: LIMITE_DIARIO }));

  app.register(encomendasRoutes, { prefix: "/encomendas" });
  app.register(disponibilidadeRoutes, { prefix: "/disponibilidade" });

  return app;
}
