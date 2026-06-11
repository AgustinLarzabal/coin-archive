import { beforeEach, describe, expect, it, vi } from "vitest"

const drizzleMock = vi.fn((client: unknown) => ({ client }))
const postgresMock = vi.fn(() => "postgres-client")

vi.mock("drizzle-orm/postgres-js", () => ({
  drizzle: drizzleMock,
}))

vi.mock("postgres", () => ({
  default: postgresMock,
}))

describe("createDatabaseClient", () => {
  beforeEach(() => {
    drizzleMock.mockClear()
    postgresMock.mockClear()
  })

  it("disables PostgreSQL JIT for application sessions", async () => {
    const { createDatabaseClient } = await import("./database")

    createDatabaseClient("postgres://example")

    expect(postgresMock).toHaveBeenCalledWith("postgres://example", {
      connection: {
        jit: "off",
      },
      prepare: false,
    })
  })
})

describe("createDatabase", () => {
  beforeEach(() => {
    drizzleMock.mockClear()
    postgresMock.mockClear()
  })

  it("wraps the postgres client with drizzle", async () => {
    const { createDatabase } = await import("./database")

    const database = createDatabase("postgres://example")

    expect(postgresMock).toHaveBeenCalledTimes(1)
    expect(drizzleMock).toHaveBeenCalledWith("postgres-client")
    expect(database).toEqual({
      client: "postgres-client",
      db: {
        client: "postgres-client",
      },
    })
  })
})
