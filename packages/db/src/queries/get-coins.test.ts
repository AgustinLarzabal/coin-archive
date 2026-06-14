import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"
import { coinSurfaceKinds } from "../schema/coin-surface"
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

  it("limits engraver filtering to face kinds", () => {
    const engraverCode = "georgios-stamatopoulos"
    const query = buildGetCoinsQuery(db, {
      engraverCode,
      limit: 1,
    }).toSQL()

    expect(query.sql).toContain('where lower("engraver"."code") = $1')
    expect(query.params).toEqual(
      expect.arrayContaining([engraverCode, ...coinSurfaceKinds])
    )
  })
})
