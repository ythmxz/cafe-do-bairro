import "dotenv/config";

// A URL do banco de testes sai da DATABASE_URL do .env, trocando só o nome do banco.
// Assim, host, porta e senha são sempre os mesmos que a API usa no desenvolvimento.
function urlDoBancoDeTeste(): string {
  if (process.env.TEST_DATABASE_URL) return process.env.TEST_DATABASE_URL;

  const base =
    process.env.DATABASE_URL ??
    "postgresql://cafe:cafe@localhost:5433/cafe?schema=public";
  const url = new URL(base);
  url.pathname = "/cafe_test";
  return url.toString();
}

export const URL_BANCO_TESTE: string = urlDoBancoDeTeste();

export const TOKEN_TESTE: string = "token-de-teste-com-mais-de-16-caracteres";
