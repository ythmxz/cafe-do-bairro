import { buildApp } from "./app";

const app = buildApp();
const porta = Number(process.env.PORT ?? 3333);
const host = process.env.HOST ?? "127.0.0.1";

try {
  await app.listen({ port: porta, host });
} catch (erro) {
  app.log.error(erro);
  process.exit(1);
}
