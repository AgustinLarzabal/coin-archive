import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"

import { createTestDatabase } from "../testing/test-database"
import type { buildGetCoinMaintenanceListItemsQuery as buildGetCoinMaintenanceListItemsQueryType } from "./get-coin-maintenance-list"

describe("buildGetCoinMaintenanceListItemsQuery", () => {
  const { client, db } = createTestDatabase("postgres://localhost/test")
  let buildGetCoinMaintenanceListItemsQuery: typeof buildGetCoinMaintenanceListItemsQueryType

  beforeAll(async () => {
    vi.stubEnv("DATABASE_URL", "postgres://localhost/test")
    ;({ buildGetCoinMaintenanceListItemsQuery } = await import(
      "./get-coin-maintenance-list"
    ))
  })

  afterAll(async () => {
    await client.end()
  })

  it("joins maintenance columns and applies normalized filters, ordering, and pagination", () => {
    const query = buildGetCoinMaintenanceListItemsQuery(db, {
      compositionCode: " silver-900 ",
      currencyCode: " euro ",
      distributionCode: " standard-circulation ",
      issuerCode: " spain ",
      page: 2,
      pageSize: 50,
      rulerCode: " charles-iii ",
      titleQuery: " spanish ",
    }).toSQL()

    expect(query.sql).toContain('"coin"."updated_at" desc')
    expect(query.sql).toContain('"coin"."id" desc')
    expect(query.sql).toContain('"coin"."title" asc')
    expect(query.sql).toContain('"coin_ruler"')
    expect(query.sql).toContain('"ruler"')
    expect(query.sql).toContain('"issuer"')
    expect(query.sql).toContain('"distribution"')
    expect(query.sql).toContain('"currency"')
    expect(query.sql).toContain('"composition"')
    expect(query.sql).toContain('lower("coin"."title") like')
    expect(query.params).toEqual([
      "%spanish%",
      "spain",
      "charles-iii",
      "standard-circulation",
      "euro",
      "silver-900",
      50,
      50,
    ])
  })
})
