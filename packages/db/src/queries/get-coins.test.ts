import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"
import { createTestDatabase } from "../testing/test-database"

describe("buildGetCoinsQuery", () => {
  const { client, db } = createTestDatabase("postgres://localhost/test")
  let buildGetCoinsQuery: typeof import("./get-coins").buildGetCoinsQuery

  beforeAll(async () => {
    vi.stubEnv("DATABASE_URL", "postgres://localhost/test")
    ;({ buildGetCoinsQuery } = await import("./get-coins"))
  })

  afterAll(async () => {
    await client.end()
  })

  it("builds only the issuer filter and selects minimal list fields", () => {
    const query = buildGetCoinsQuery(db, {
      issuerCode: "spain",
      limit: 1,
    }).toSQL()

    expect(query.sql).toContain('with recursive issuer_tree(id) as')
    expect(query.sql).not.toContain('"coin_reference"')
    expect(query.sql).not.toContain('"coin_surface"')
    expect(query.sql).toContain('"issuer"."iso_code"')
    expect(query.params).toEqual(["spain", 1])
  })
})
