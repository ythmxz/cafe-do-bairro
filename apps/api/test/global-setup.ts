import { execSync } from "node:child_process";
import pg from "pg";
import { TEST_DB_URL } from "./env";

export default async function setup(): Promise<void> {
  const url = new URL(TEST_DB_URL);
  const dbName = url.pathname.slice(1);

  // Trava de segurança.
  if (!/^[a-z0-9_]+_test$/.test(dbName)) {
    const error = new Error(
      `Os testes só rodam em bancos cujo nome termina em "_test" (recebido: "${dbName}").`,
    );
    error.stack = error.message;
    throw error;
  }

  const adminUrl = new URL(url);
  adminUrl.pathname = "/postgres";
  adminUrl.search = "";

  const client = new pg.Client({ connectionString: adminUrl.toString() });
  await client.connect();
  try {
    const exists = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName],
    );
    if (exists.rowCount === 0) {
      await client.query(`CREATE DATABASE "${dbName}"`);
    }
  } finally {
    await client.end();
  }

  execSync("pnpm exec prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: TEST_DB_URL },
  });
}
