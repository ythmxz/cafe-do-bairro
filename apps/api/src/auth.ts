import { createHash, timingSafeEqual } from "node:crypto";
import type { FastifyRequest } from "fastify";
import { ErroHttp } from "./erros";

function iguais(a: string, b: string): boolean {
  const hashA = createHash("sha256").update(a).digest();
  const hashB = createHash("sha256").update(b).digest();
  return timingSafeEqual(hashA, hashB);
}

export async function exigirSenha(req: FastifyRequest): Promise<void> {
  const esperado = process.env.ADMIN_TOKEN;
  const recebido = req.headers.authorization?.replace(/^Bearer\s+/i, "") ?? "";

  if (!esperado || !iguais(recebido, esperado)) {
    throw new ErroHttp(401, "Não autorizado");
  }
}
