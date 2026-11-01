import type { FastifyInstance } from "fastify";
import type { CreateOrderInput } from "@cafe/shared";
import { buildApp, type AppOptions } from "../src/app";
import { toIsoDate, todayInBrazil } from "../src/dates";
import { prisma } from "../src/db";
import { TEST_ADMIN_TOKEN } from "./env";

export { prisma };

export type OrderBody = CreateOrderInput;
export type App = FastifyInstance;

export const authHeaders: Record<string, string> = {
  authorization: `Bearer ${TEST_ADMIN_TOKEN}`,
};

export function daysFromToday(days: number): string {
  const date = new Date(`${todayInBrazil()}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return toIsoDate(date);
}

export function buildOrder(extra: Partial<OrderBody> = {}): OrderBody {
  return {
    cliente: "Maria",
    telefone: "(73) 99999-9999",
    produto: "Bolo de cenoura",
    dataEntrega: daysFromToday(10),
    ...extra,
  };
}

export async function startApp(options: AppOptions = {}): Promise<App> {
  const app = buildApp({ rateLimit: false, ...options });
  await app.ready();
  return app;
}

export async function resetDatabase(): Promise<void> {
  await prisma.order.deleteMany();
}
