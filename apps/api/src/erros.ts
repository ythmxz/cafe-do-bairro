import { z } from "zod";

export class ErroHttp extends Error {
  constructor(
    public status: number,
    mensagem: string,
    public detalhes?: unknown,
  ) {
    super(mensagem);
  }
}

export function validar<S extends z.ZodType>(
  schema: S,
  dados: unknown,
): z.output<S> {
  const resultado = schema.safeParse(dados);

  if (!resultado.success) {
    const detalhes = resultado.error.issues.map((problema) => ({
      campo: problema.path.map(String).join("."),
      mensagem: problema.message,
    }));
    throw new ErroHttp(400, "Dados inválidos", detalhes);
  }

  return resultado.data as z.output<S>;
}

export function naoEncontrado(erro: unknown): boolean {
  return (
    typeof erro === "object" &&
    erro !== null &&
    "code" in erro &&
    erro.code === "P2025"
  );
}
