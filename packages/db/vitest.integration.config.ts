import { defineConfig } from "vitest/config"

import { assertIntegrationDatabaseUrl } from "./src/integration-target.js"

assertIntegrationDatabaseUrl(process.env.DATABASE_URL)

export default defineConfig({
  test: {
    environment: "node",
    fileParallelism: false,
    include: ["src/**/*.integration.test.ts"],
  },
})
