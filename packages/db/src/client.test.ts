import { describe, expect, it } from "vitest"

import { createDatabase } from "./database"
import { createDatabaseAccessor } from "./client"

describe("createDatabaseAccessor", () => {
  it("does not reuse a database client between Cloudflare Worker requests", () => {
    const accessor = createDatabaseAccessor(
      createDatabase,
      () => "postgres://example",
      () => true
    )

    expect(accessor.get()).not.toBe(accessor.get())
  })

  it("reuses the database client in a local Node runtime", () => {
    const accessor = createDatabaseAccessor(
      createDatabase,
      () => "postgres://example",
      () => false
    )

    expect(accessor.get()).toBe(accessor.get())
  })
})
