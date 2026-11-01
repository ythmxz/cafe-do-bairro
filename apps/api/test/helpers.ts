import { buildApp } from "../src/app";
import { hojeNoBrasil, paraTexto } from "../src/datas";
import { prisma } from "../src/db";
import { TOKEN_TESTE } from "./ambiente";

export { prisma };

export const comSenha: Record<string, string> = {
  authorization: `Bearer ${TOKEN_TESTE}`,
};

export type CorpoEncomenda = {
  cliente: string;
  telefone: string;
  produto: string;
  dataEntrega: string;
};

export function diaFuturo(dias: number): string {
  const data = new Date(`${hojeNoBrasil()}T00:00:00.000Z`);
  data.setUTCDate(data.getUTCDate() + dias);
  return paraTexto(data);
}

export function umaEncomenda(
  extra: Partial<CorpoEncomenda> = {},
): CorpoEncomenda {
  return {
    cliente: "Maria",
    telefone: "(73) 99999-9999",
    produto: "Bolo de cenoura",
    dataEntrega: diaFuturo(10),
    ...extra,
  };
}

export type App = Awaited<ReturnType<typeof iniciarApp>>;

export async function iniciarApp(opcoes: Parameters<typeof buildApp>[0] = {}) {
  const app = buildApp({ limitarRequisicoes: false, ...opcoes });
  await app.ready();
  return app;
}

export async function limparBanco(): Promise<void> {
  await prisma.encomenda.deleteMany();
}
