import { DAILY_LIMIT } from "@cafe/shared";
import type { Transaction } from "./db";
import { toBrazilianDate, toDate } from "./dates";
import { HttpError } from "./errors";

const MS_PER_DAY = 86_400_000;

export async function countOrdersOn(
  db: Transaction,
  date: string,
): Promise<number> {
  return db.order.count({ where: { deliveryDate: toDate(date) } });
}

export async function reserveSlot(
  tx: Transaction,
  date: string,
): Promise<void> {
  // Trava por dia liberada ao fim da transação para serializar pedidos simultâneos da mesma data.
  const lockKey = Math.floor(toDate(date).getTime() / MS_PER_DAY);
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(CAST(${lockKey} AS BIGINT))`;

  const taken = await countOrdersOn(tx, date);
  if (taken >= DAILY_LIMIT) {
    throw new HttpError(
      409,
      `Já temos ${DAILY_LIMIT} encomendas para ${toBrazilianDate(date)}. Escolha outra data.`,
    );
  }
}
