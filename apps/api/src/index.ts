import "dotenv/config";
import type { IncomingMessage, ServerResponse } from "node:http";
import { buildApp } from "./app";

const app = buildApp();

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  await app.ready();
  app.server.emit("request", req, res);
}
