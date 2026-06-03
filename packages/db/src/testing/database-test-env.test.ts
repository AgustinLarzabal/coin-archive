import { describe, expect, it } from "vitest"
import { assertSafeDatabaseTestUrl, getDatabaseName } from "./database-test-env"

describe("database test environment", () => {
  it("accepts a clearly test-specific database URL", () => {
    expect(() =>
      assertSafeDatabaseTestUrl(
        "postgresql://coin_archive:coin_archive@localhost:5432/coin_archive_test"
      )
    ).not.toThrow()
  })

  it("rejects a database URL whose database name is not clearly test-specific", () => {
    expect(() =>
      assertSafeDatabaseTestUrl(
        "postgresql://coin_archive:coin_archive@localhost:5432/coin_archive"
      )
    ).toThrowError(/DATABASE_TEST_URL must point to a dedicated test database/i)
  })

  it("returns the database name from a PostgreSQL URL", () => {
    expect(
      getDatabaseName(
        "postgresql://coin_archive:coin_archive@localhost:5432/coin_archive_test"
      )
    ).toBe("coin_archive_test")
  })
})
