import { LIMITE_DIARIO } from "@cafe/shared";
import type { Transacao } from "./db";
import { paraData } from "./datas";
import { ErroHttp } from "./erros";

const MS_POR_DIA = 86_400_000;

export async function contarDoDia(db: Transacao, dia: string): Promise<number> {
  return db.encomenda.count({ where: { dataEntrega: paraData(dia) } });
}

export async function reservarVaga(tx: Transacao, dia: string): Promise<void> {
  const chave = Math.floor(paraData(dia).getTime() / MS_POR_DIA);
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(CAST(${chave} AS BIGINT))`;

  const ocupadas = await contarDoDia(tx, dia);
  if (ocupadas >= LIMITE_DIARIO) {
    const [ano, mes, diaDoMes] = dia.split("-");
    throw new ErroHttp(
      409,
      `Já temos ${LIMITE_DIARIO} encomendas para ${diaDoMes}/${mes}/${ano}. Escolha outra data.`,
    );
  }
}
