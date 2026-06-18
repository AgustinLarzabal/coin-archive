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

  it("limits coins before joining optional surface detail", () => {
    const query = buildGetCoinsQuery(db, {
      distributionCode: "standard-circulation",
      issuerCode: "spain",
      limit: 1,
    }).toSQL()

    expect(query.sql).toContain('with recursive issuer_tree(id) as')
    expect(query.sql).toContain('"coin"."distribution_id" in (')
    expect(query.sql).toContain('from "distribution"')
    expect(query.sql).not.toContain('"coin_reference"')
    expect(query.sql).toContain('"limited_coins"')
    expect(query.sql).toContain('"coin_surface"')
    expect(query.sql).toContain('"coin_face_engraver"')
    expect(query.sql).toContain('"engraver"')
    expect(query.sql).toContain('"issuer"."iso_code"')
    expect(query.params).toEqual(["standard-circulation", "spain", 1])
  })
})
