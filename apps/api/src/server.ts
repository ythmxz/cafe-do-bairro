import { buildApp } from "./app";

const app = buildApp();

if (!process.env.ADMIN_TOKEN || process.env.ADMIN_TOKEN.length < 16) {
  console.error("Defina ADMIN_TOKEN (mínimo de 16 caracteres) no arquivo .env");
  process.exit(1);
}

const porta = Number(process.env.PORT ?? 3333);
const host = process.env.HOST ?? "127.0.0.1";

try {
  await app.listen({ port: porta, host });
} catch (erro) {
  app.log.error(erro);
  process.exit(1);
}
