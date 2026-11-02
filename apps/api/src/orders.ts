import {
  type CreateOrderInput,
  createOrderSchema,
  isoDateSchema,
  ORDER_STATUS,
  type Order,
  type UpdateOrderInput,
  updateOrderSchema,
} from "@cafe/shared";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { Order as OrderRecord, Prisma } from "../generated/client.js";
import { requireAdmin } from "./auth.js";
import { reserveSlot } from "./daily-limit.js";
import { toDate, todayInBrazil, toIsoDate } from "./dates.js";
import { prisma } from "./db.js";
import { HttpError, isNotFoundError, parseOrThrow } from "./errors.js";

const paramsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const filterSchema = z.object({
  data: isoDateSchema.optional(),
  status: z.enum(ORDER_STATUS).optional(),
});

function toResponse(order: OrderRecord): Order {
  return {
    id: order.id,
    cliente: order.customer,
    telefone: order.phone,
    produto: order.product,
    dataEntrega: toIsoDate(order.deliveryDate),
    status: order.status,
    criadaEm: order.createdAt.toISOString(),
  };
}

function toCreateData(input: CreateOrderInput): Prisma.OrderCreateInput {
  return {
    customer: input.cliente,
    phone: input.telefone,
    product: input.produto,
    deliveryDate: toDate(input.dataEntrega),
  };
}

function toUpdateData(input: UpdateOrderInput): Prisma.OrderUpdateInput {
  return {
    customer: input.cliente,
    phone: input.telefone,
    product: input.produto,
    deliveryDate: input.dataEntrega ? toDate(input.dataEntrega) : undefined,
    status: input.status,
  };
}

function orderNotFound(): HttpError {
  return new HttpError(404, "Encomenda não encontrada");
}

function assertNotPast(date: string): void {
  if (date < todayInBrazil()) {
    throw new HttpError(400, "A data de entrega não pode estar no passado");
  }
}

export async function orderRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    "/",
    { config: { rateLimit: { max: 20, timeWindow: "1 minute" } } },
    async (request, reply) => {
      const input = parseOrThrow(createOrderSchema, request.body);
      assertNotPast(input.dataEntrega);

      const order = await prisma.$transaction(async (tx) => {
        await reserveSlot(tx, input.dataEntrega);
        return tx.order.create({ data: toCreateData(input) });
      });

      return reply.code(201).send(toResponse(order));
    },
  );

  app.get(
    "/",
    { onRequest: requireAdmin },
    async (request): Promise<Order[]> => {
      const filter = parseOrThrow(filterSchema, request.query);

      const orders = await prisma.order.findMany({
        where: {
          deliveryDate: filter.data ? toDate(filter.data) : undefined,
          status: filter.status,
        },
        orderBy: [{ deliveryDate: "asc" }, { id: "asc" }],
      });

      return orders.map(toResponse);
    },
  );

  app.patch(
    "/:id",
    { onRequest: requireAdmin },
    async (request): Promise<Order> => {
      const { id } = parseOrThrow(paramsSchema, request.params);
      const input = parseOrThrow(updateOrderSchema, request.body);
      if (input.dataEntrega) assertNotPast(input.dataEntrega);

      try {
        const order = await prisma.$transaction(async (tx) => {
          if (input.dataEntrega) {
            const current = await tx.order.findUnique({ where: { id } });
            if (!current) throw orderNotFound();

            // Reenviar a mesma data não disputa uma vaga nova.
            if (toIsoDate(current.deliveryDate) !== input.dataEntrega) {
              await reserveSlot(tx, input.dataEntrega);
            }
          }

          return tx.order.update({ where: { id }, data: toUpdateData(input) });
        });

        return toResponse(order);
      } catch (error) {
        if (isNotFoundError(error)) throw orderNotFound();
        throw error;
      }
    },
  );

  app.delete("/:id", { onRequest: requireAdmin }, async (request, reply) => {
    const { id } = parseOrThrow(paramsSchema, request.params);

    try {
      await prisma.order.delete({ where: { id } });
    } catch (error) {
      if (isNotFoundError(error)) throw orderNotFound();
      throw error;
    }

    return reply.code(204).send();
  });
}
