import { type Availability, DAILY_LIMIT, isoDateSchema } from "@cafe/shared";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { countOrdersOn } from "./daily-limit";
import { prisma } from "./db";
import { parseOrThrow } from "./errors";

const querySchema = z.object({
  data: isoDateSchema,
});

export async function availabilityRoutes(app: FastifyInstance): Promise<void> {
  app.get("/", async (request): Promise<Availability> => {
    const { data } = parseOrThrow(querySchema, request.query);

    const taken = await countOrdersOn(prisma, data);
    const remaining = Math.max(DAILY_LIMIT - taken, 0);

    return {
      data,
      limite: DAILY_LIMIT,
      ocupadas: taken,
      vagas: remaining,
      disponivel: remaining > 0,
    };
  });
}
