import { describe, expect, it } from "vitest"

import { assertIntegrationDatabaseUrl } from "./integration-target.js"

describe("integration database target", () => {
  it("accepts the dedicated local test database", () => {
    expect(() =>
      assertIntegrationDatabaseUrl(
        "postgresql://coin_archive_test@127.0.0.1:5433/coin_archive_test"
      )
    ).not.toThrow()
  })

  it.each([
    undefined,
    "not a database URL",
    "postgresql://secret@staging.example.com:5433/coin_archive_test",
    "postgresql://coin_archive_test@127.0.0.1:5433/coin_archive",
    "postgresql://coin_archive_test@127.0.0.1:5432/coin_archive_test",
    "postgresql://coin_archive_test@127.0.0.1:5433/coin_archive_test?host=staging.example.com",
  ])("rejects an unsupported target %j without exposing it", (databaseUrl) => {
    expect(() => assertIntegrationDatabaseUrl(databaseUrl)).toThrow("pnpm test:db")

    try {
      assertIntegrationDatabaseUrl(databaseUrl)
    } catch (error) {
      expect((error as Error).message).not.toContain("secret")
      expect((error as Error).message).not.toContain(databaseUrl ?? "undefined")
    }
  })
})
