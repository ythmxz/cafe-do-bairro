import "dotenv/config";

// Deriva o banco de testes a partir da DATABASE_URL do .env trocando apenas o nome do banco.
function resolveTestDbUrl(): string {
  if (process.env.TEST_DATABASE_URL) return process.env.TEST_DATABASE_URL;

  const base =
    process.env.DATABASE_URL ??
    "postgresql://cafe:cafe@localhost:5433/cafe?schema=public";
  const url = new URL(base);
  url.pathname = "/cafe_test";
  return url.toString();
}

export const TEST_DB_URL: string = resolveTestDbUrl();

export const TEST_ADMIN_TOKEN: string =
  "token-de-teste-com-mais-de-16-caracteres";
