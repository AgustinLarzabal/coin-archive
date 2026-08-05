import { describe, expect, it } from "vitest"

import { getRuntimeEnvironment } from "./runtime-environment.server"

const validEnvironment = {
  DATABASE_URL: "postgresql://archive.example.test/coin_archive",
}

describe("getRuntimeEnvironment", () => {
  it("returns the Worker or local runtime settings needed by the server", () => {
    expect(getRuntimeEnvironment(validEnvironment)).toEqual({
      databaseUrl: "postgresql://archive.example.test/coin_archive",
    })
  })

  it("lists every missing required setting without exposing values", () => {
    const invalidDatabaseUrl = " \t "
    const readEnvironment = () =>
      getRuntimeEnvironment({ DATABASE_URL: invalidDatabaseUrl })

    expect(readEnvironment).toThrow(
      "Missing required runtime configuration: DATABASE_URL."
    )
    expect(readEnvironment).not.toThrow(invalidDatabaseUrl)
  })
})
