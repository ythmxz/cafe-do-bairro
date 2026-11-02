import type { ErrorDetail } from "@cafe/shared";
import type { z } from "zod";
import { Prisma } from "../generated/client.js";

export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly details?: ErrorDetail[],
  ) {
    super(message);
  }
}

export function parseOrThrow<S extends z.ZodType>(
  schema: S,
  data: unknown,
): z.output<S> {
  const result = schema.safeParse(data);

  if (!result.success) {
    const details: ErrorDetail[] = result.error.issues.map((issue) => ({
      campo: issue.path.map(String).join("."),
      mensagem: issue.message,
    }));
    throw new HttpError(400, "Dados inválidos", details);
  }

  return result.data;
}

// P2025: o registro que a operação esperava encontrar não existe.
export function isNotFoundError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  );
}
