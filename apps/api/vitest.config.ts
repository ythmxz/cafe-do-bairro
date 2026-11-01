import { defineConfig } from "vitest/config";
import { TOKEN_TESTE, URL_BANCO_TESTE } from "./test/ambiente.ts";

export default defineConfig({
  test: {
    globalSetup: ["./test/global-setup.ts"],
    env: {
      DATABASE_URL: URL_BANCO_TESTE,
      ADMIN_TOKEN: TOKEN_TESTE,
    },
    fileParallelism: false,
  },
});
