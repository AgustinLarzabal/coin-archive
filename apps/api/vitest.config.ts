import { fileURLToPath } from "node:url"

import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    alias: {
      "@coin-archive/api": fileURLToPath(
        new URL("../../packages/api/src/index.ts", import.meta.url)
      ),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
})
