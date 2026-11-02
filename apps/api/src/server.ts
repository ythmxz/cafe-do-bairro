import "dotenv/config";
import { buildApp } from "./app.js";

const adminToken = process.env.ADMIN_TOKEN;
if (!adminToken || adminToken.length < 16) {
  console.error("Defina ADMIN_TOKEN (mínimo de 16 caracteres) no arquivo .env");
  process.exit(1);
}

const app = buildApp();
const port = Number(process.env.PORT ?? 3333);
const host = process.env.HOST ?? "127.0.0.1";

try {
  await app.listen({ port, host });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
