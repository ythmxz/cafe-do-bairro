import { defineConfig } from "vitest/config";
import { TEST_ADMIN_TOKEN, TEST_DB_URL } from "./test/env.ts";

export default defineConfig({
  test: {
    globalSetup: ["./test/global-setup.ts"],
    env: {
      DATABASE_URL: TEST_DB_URL,
      ADMIN_TOKEN: TEST_ADMIN_TOKEN,
    },
    fileParallelism: false,
  },
});
