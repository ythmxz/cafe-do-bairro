import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { LIMITE_DIARIO, novaEncomendaSchema } from "@cafe/shared";
import { prisma } from "./db";
import { validar } from "./erros";
import { contarDoDia } from "./limite";

const querySchema = z.object({
  data: novaEncomendaSchema.shape.dataEntrega,
});

export async function disponibilidadeRoutes(app: FastifyInstance) {
  app.get("/", async (req) => {
    const { data } = validar(querySchema, req.query);

    const ocupadas = await contarDoDia(prisma, data);
    const vagas = Math.max(LIMITE_DIARIO - ocupadas, 0);

    return {
      data,
      limite: LIMITE_DIARIO,
      ocupadas,
      vagas,
      disponivel: vagas > 0,
    };
  });
}
