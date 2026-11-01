import { execSync } from "node:child_process";
import pg from "pg";
import { URL_BANCO_TESTE } from "./ambiente";

export default async function preparar(): Promise<void> {
  const url = new URL(URL_BANCO_TESTE);
  const nome = url.pathname.slice(1);

  // Trava de segurança: os testes apagam dados, então só rodam em bancos "_test".
  if (!/^[a-z0-9_]+_test$/.test(nome)) {
    const erro = new Error(
      `Os testes só rodam em bancos cujo nome termina em "_test" (recebido: "${nome}").`,
    );
    erro.stack = erro.message; // o rastreamento de pilha só atrapalha esta mensagem
    throw erro;
  }

  // Cria o banco de testes se ele ainda não existir.
  const admin = new URL(url);
  admin.pathname = "/postgres";
  admin.search = "";

  const cliente = new pg.Client({ connectionString: admin.toString() });
  await cliente.connect();
  try {
    const existe = await cliente.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [nome],
    );
    if (existe.rowCount === 0) {
      await cliente.query(`CREATE DATABASE "${nome}"`);
    }
  } finally {
    await cliente.end();
  }

  // Aplica as migrações do projeto no banco de testes.
  execSync("pnpm exec prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: URL_BANCO_TESTE },
  });
}
