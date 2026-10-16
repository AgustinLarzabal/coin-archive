import { describe, expect, it, vi } from "vitest"

import {
  parseLocalResetTarget,
  parseStagingResetTarget,
  resetStagingDatabase,
} from "./reset.js"

describe("local database reset safety", () => {
  it.each(["localhost", "127.0.0.1"])(
    "permits the exact local host %s",
    (host) => {
      expect(
        parseLocalResetTarget(
          `postgresql://coin_archive:secret@${host}:5432/coin_archive_reset_test`
        )
      ).toEqual({
        databaseName: "coin_archive_reset_test",
        databaseUrl: `postgresql://coin_archive:secret@${host}:5432/coin_archive_reset_test`,
      })
    }
  )

  it.each([
    "database.internal",
    "10.0.0.12",
    "192.168.1.12",
    "localhost.example.com",
    "[::1]",
  ])("rejects the non-permitted host %s", (host) => {
    expect(() =>
      parseLocalResetTarget(
        `postgresql://coin_archive:secret@${host}:5432/coin_archive_reset_test`
      )
    ).toThrow("Database reset is permitted only for localhost or 127.0.0.1")
  })

  it("rejects a query parameter that makes pg override the parsed host", () => {
    expect(() =>
      parseLocalResetTarget(
        "postgresql://coin_archive:secret@localhost:5432/coin_archive_reset_test?host=database.internal"
      )
    ).toThrow("Database reset is permitted only for localhost or 127.0.0.1")
  })

  it.each([
    undefined,
    "",
    "not a database URL",
    "https://localhost/coin_archive_reset_test",
    "postgresql://localhost",
  ])("rejects the missing or malformed database URL %j", (databaseUrl) => {
    expect(() => parseLocalResetTarget(databaseUrl)).toThrow(
      "A valid local PostgreSQL DATABASE_URL with a database name is required"
    )
  })

  it("decodes the database name used in the reset warning", () => {
    expect(
      parseLocalResetTarget(
        "postgresql://coin_archive@localhost/coin%5Farchive%5Freset"
      )
    ).toMatchObject({ databaseName: "coin_archive_reset" })
  })
})

describe("staging database reset safety", () => {
  const credentialSentinel = "credential-sentinel"
  const hostname = "ep-example-123456.eu-central-1.aws.neon.tech"
  const databaseName = "coin_archive_staging"
  const databaseUrl = `postgresql://${credentialSentinel}@${hostname}/${databaseName}?sslmode=require`
  const confirmation = `${hostname}/${databaseName}`

  function expectSafeRejection(
    rejectedDatabaseUrl: string | undefined,
    rejectedConfirmation: string | undefined
  ) {
    let rejection: unknown

    try {
      parseStagingResetTarget(rejectedDatabaseUrl, rejectedConfirmation)
    } catch (error) {
      rejection = error
    }

    expect(rejection).toBeInstanceOf(Error)
    expect((rejection as Error).message).not.toContain(credentialSentinel)
  }

  it("permits a direct Neon target with an exact confirmation", () => {
    expect(parseStagingResetTarget(databaseUrl, confirmation)).toEqual({
      databaseName,
      databaseUrl,
      hostname,
    })
  })

  it("decodes the database name used in the confirmation", () => {
    const encodedDatabaseUrl = `postgresql://${credentialSentinel}@${hostname}/coin%5Farchive%5Fstaging`

    expect(
      parseStagingResetTarget(encodedDatabaseUrl, confirmation)
    ).toMatchObject({ databaseName })
  })

  it.each([
    undefined,
    "",
    "not a database URL",
    `https://${credentialSentinel}@${hostname}/${databaseName}`,
    `postgresql://${credentialSentinel}@${hostname}`,
  ])("rejects the missing or malformed database URL %j", (rejectedUrl) => {
    expectSafeRejection(rejectedUrl, confirmation)
  })

  it.each(["localhost", "127.0.0.1", "database.internal", "example.neon.tech"])(
    "rejects the non-Neon-direct host %s",
    (rejectedHostname) => {
      expectSafeRejection(
        `postgresql://${credentialSentinel}@${rejectedHostname}/${databaseName}`,
        confirmation
      )
    }
  )

  it("rejects a Neon pooler hostname", () => {
    expectSafeRejection(
      `postgresql://${credentialSentinel}@ep-example-123456-pooler.eu-central-1.aws.neon.tech/${databaseName}`,
      confirmation
    )
  })

  it("rejects a query parameter that overrides the parsed host", () => {
    expectSafeRejection(`${databaseUrl}&host=database.internal`, confirmation)
  })

  it.each([undefined, "", "wrong-target.example/other_database"])(
    "rejects the missing or wrong confirmation %j",
    (rejectedConfirmation) => {
      expectSafeRejection(databaseUrl, rejectedConfirmation)
    }
  )

  it("does not rebuild a rejected staging target", async () => {
    const rebuild = vi.fn<(databaseUrl: string) => Promise<void>>()

    await expect(
      resetStagingDatabase(databaseUrl, "wrong-target.example/other", rebuild)
    ).rejects.toThrow(`--confirm ${JSON.stringify(confirmation)}`)
    expect(rebuild).not.toHaveBeenCalled()
  })

  it("rebuilds a validated staging target", async () => {
    const rebuild = vi.fn<(databaseUrl: string) => Promise<void>>()
    rebuild.mockResolvedValue(undefined)
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined)

    await resetStagingDatabase(databaseUrl, confirmation, rebuild)

    expect(rebuild).toHaveBeenCalledOnce()
    expect(rebuild).toHaveBeenCalledWith(databaseUrl)
    expect(log).toHaveBeenCalledWith(
      `Resetting staging database ${JSON.stringify(confirmation)} before migrating and seeding.`
    )
    expect(log.mock.calls.flat().join(" ")).not.toContain(credentialSentinel)
    log.mockRestore()
  })
})
