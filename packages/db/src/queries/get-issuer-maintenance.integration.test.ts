import { describe, expect, it } from "vitest"

import { db } from "../index"
import { createIssuer } from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"
import {
  getIssuerMaintenanceRecordWithDatabase,
  getIssuerMaintenanceRecordsWithDatabase,
} from "./get-issuer-maintenance"

describe("Issuer maintenance reads integration", () => {
  useTestDatabaseIsolation(db)

  it("filters and cursor-paginates Issuers with parent context", async () => {
    const parent = await createIssuer({
      code: "argentine-republic",
      isoCode: "AR",
      name: "Argentine Republic",
    })
    const first = await createIssuer({
      code: "buenos-aires",
      isoCode: "AR",
      name: "Buenos Aires",
      parentIssuerId: parent.id,
    })
    const second = await createIssuer({
      code: "cordoba",
      isoCode: "AR",
      name: "Córdoba",
      parentIssuerId: parent.id,
    })

    const page = await getIssuerMaintenanceRecordsWithDatabase(db, {
      q: "ar",
      sort: "name",
      order: "asc",
      limit: 2,
    })
    expect(page).toHaveLength(2)
    expect(page[0]).toMatchObject({
      id: parent.id,
      parent: null,
      version: 1,
    })
    expect(page[1]).toMatchObject({
      id: first.id,
      parent: {
        id: parent.id,
        code: parent.code,
        name: parent.name,
      },
    })

    await expect(
      getIssuerMaintenanceRecordsWithDatabase(db, {
        q: "ar",
        sort: "name",
        order: "asc",
        cursor: {
          value: page[1].cursorValue,
          secondaryValue: page[1].cursorSecondaryValue,
          id: page[1].id,
        },
      })
    ).resolves.toMatchObject([{ id: second.id }])
  })

  it("finds Issuers by ISO Code and reads a single detail", async () => {
    const issuer = await createIssuer({
      code: "roman-empire",
      isoCode: "IT",
      name: "Roman Empire",
    })

    await expect(
      getIssuerMaintenanceRecordsWithDatabase(db, { q: "it" })
    ).resolves.toMatchObject([{ id: issuer.id, isoCode: "IT" }])
    await expect(
      getIssuerMaintenanceRecordWithDatabase(db, issuer.id)
    ).resolves.toMatchObject({ id: issuer.id, version: 1, parent: null })
  })
})
