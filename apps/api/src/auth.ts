import { createHash, timingSafeEqual } from "node:crypto";
import type { FastifyRequest } from "fastify";
import { HttpError } from "./errors.js";

function safeEqual(a: string, b: string): boolean {
  const hashA = createHash("sha256").update(a).digest();
  const hashB = createHash("sha256").update(b).digest();
  return timingSafeEqual(hashA, hashB);
}

export async function requireAdmin(request: FastifyRequest): Promise<void> {
  const expected = process.env.ADMIN_TOKEN;
  const received =
    request.headers.authorization?.replace(/^Bearer\s+/i, "") ?? "";

  if (!expected || !safeEqual(received, expected)) {
    throw new HttpError(401, "Não autorizado");
  }
}
