import { defineConfig } from "vitest/config"

if (
  process.env.DATABASE_URL !==
  "postgresql://coin_archive_test@127.0.0.1:5433/coin_archive_test"
) {
  throw new Error(
    "Worker integration tests require the dedicated local test database"
  )
}

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.integration.test.ts"],
  },
})
