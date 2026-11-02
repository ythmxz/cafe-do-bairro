import type { IncomingMessage, ServerResponse } from "node:http";
import type { ApiError } from "@cafe/shared";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import Fastify, { type FastifyInstance } from "fastify";
import { availabilityRoutes } from "./availability.js";
import { HttpError } from "./errors.js";
import { orderRoutes } from "./orders.js";

export type AppOptions = {
  rateLimit?: boolean;
};

function getStatusCode(error: unknown): number {
  if (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    typeof error.statusCode === "number"
  ) {
    return error.statusCode;
  }
  return 500;
}

export function buildApp(options: AppOptions = {}): FastifyInstance {
  const app = Fastify({ logger: process.env.NODE_ENV !== "test" });

  app.register(cors, {
    origin: process.env.WEB_URL ?? "http://localhost:3000",
    methods: ["GET", "POST", "PATCH", "DELETE"],
  });

  app.register(rateLimit, {
    global: false,
    allowList: () => options.rateLimit === false,
    errorResponseBuilder: () =>
      new HttpError(
        429,
        "Muitas tentativas em pouco tempo. Aguarde um minuto e tente de novo.",
      ),
  });

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof HttpError) {
      const body: ApiError = { erro: error.message, detalhes: error.details };
      return reply.code(error.statusCode).send(body);
    }

    const statusCode = getStatusCode(error);
    if (statusCode >= 500) {
      app.log.error(error);
      const body: ApiError = { erro: "Erro interno do servidor" };
      return reply.code(500).send(body);
    }

    const body: ApiError = { erro: "Requisição inválida" };
    return reply.code(statusCode).send(body);
  });

  app.setNotFoundHandler((_request, reply) => {
    const body: ApiError = { erro: "Rota não encontrada" };
    return reply.code(404).send(body);
  });

  app.get("/saude", async () => ({ ok: true }));

  app.register(orderRoutes, { prefix: "/encomendas" });
  app.register(availabilityRoutes, { prefix: "/disponibilidade" });

  return app;
}

let vercelApp: FastifyInstance | null = null;

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  if (!vercelApp) {
    vercelApp = buildApp();
    await vercelApp.ready();
  }
  vercelApp.server.emit("request", req, res);
}
