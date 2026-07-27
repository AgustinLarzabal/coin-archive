import { describe, expect, it } from "vitest"

import { requireStagingDatabase } from "./staging-reset"

describe("staging reset guard", () => {
  it("allows the reset operation only when explicitly targeted at staging", () => {
    expect(() =>
      requireStagingDatabase({
        environment: "staging",
        databaseUrl: "postgresql://staging.example/coin_archive",
        stagingDatabaseUrl: "postgresql://staging.example/coin_archive",
      })
    ).not.toThrow()
  })

  it("refuses production, missing targets, and a database URL that is not staging", () => {
    expect(() =>
      requireStagingDatabase({
        environment: "production",
        databaseUrl: "postgresql://production.example/coin_archive",
        stagingDatabaseUrl: "postgresql://staging.example/coin_archive",
      })
    ).toThrow(
      "COIN_ARCHIVE_ENVIRONMENT must be staging"
    )
    expect(() =>
      requireStagingDatabase({
        environment: undefined,
        databaseUrl: "postgresql://staging.example/coin_archive",
        stagingDatabaseUrl: "postgresql://staging.example/coin_archive",
      })
    ).toThrow(
      "COIN_ARCHIVE_ENVIRONMENT must be staging"
    )
    expect(() =>
      requireStagingDatabase({
        environment: "staging",
        databaseUrl: "postgresql://production.example/coin_archive",
        stagingDatabaseUrl: "postgresql://staging.example/coin_archive",
      })
    ).toThrow("DATABASE_URL must match STAGING_DATABASE_URL")
  })
})
