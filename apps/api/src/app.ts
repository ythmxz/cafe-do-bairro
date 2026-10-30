import Fastify from "fastify";
import cors from "@fastify/cors";
import { LIMITE_DIARIO } from "@cafe/shared";

export function buildApp() {
  const app = Fastify({ logger: true });

  app.register(cors, {
    origin: process.env.WEB_URL ?? "http://localhost:3000",
  });

  app.get("/saude", async () => ({
    ok: true,
    limiteDiario: LIMITE_DIARIO,
  }));

  return app;
}
