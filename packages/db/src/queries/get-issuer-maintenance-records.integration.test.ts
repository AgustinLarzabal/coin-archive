import { describe, expect, it } from "vitest"

import { db } from "../index"
import { createIssuer } from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"
import { getIssuerMaintenanceRecords } from "./get-issuer-maintenance-records"

describe("getIssuerMaintenanceRecords integration", () => {
  useTestDatabaseIsolation(db)

  it("returns issuers sorted by name and code with parent issuer context", async () => {
    const argentineRepublic = await createIssuer({
      code: "argentine-republic",
      name: "Argentine Republic",
      isoCode: "AR",
    })
    const laRioja = await createIssuer({
      code: "la-rioja",
      name: "Issuer",
      isoCode: "AR",
      parentIssuerId: argentineRepublic.id,
    })
    const rioNegro = await createIssuer({
      code: "rio-negro",
      name: "Issuer",
      isoCode: "AR",
      parentIssuerId: argentineRepublic.id,
    })

    await expect(getIssuerMaintenanceRecords()).resolves.toStrictEqual([
      {
        id: argentineRepublic.id,
        code: "argentine-republic",
        isoCode: "AR",
        name: "Argentine Republic",
        parent: null,
      },
      {
        id: laRioja.id,
        code: "la-rioja",
        isoCode: "AR",
        name: "Issuer",
        parent: {
          id: argentineRepublic.id,
          code: "argentine-republic",
          name: "Argentine Republic",
        },
      },
      {
        id: rioNegro.id,
        code: "rio-negro",
        isoCode: "AR",
        name: "Issuer",
        parent: {
          id: argentineRepublic.id,
          code: "argentine-republic",
          name: "Argentine Republic",
        },
      },
    ])
  })
})
