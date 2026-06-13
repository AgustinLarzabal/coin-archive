import { describe, expect, it } from "vitest"
import { db } from "../index"
import { createIssuer } from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"
import { getIssuers } from "./get-issuers"

describe("getIssuers integration", () => {
  useTestDatabaseIsolation(db)

  it("returns issuer options sorted by name and code", async () => {
    const bankOfCanada = await createIssuer({
      code: "bank-of-canada",
      name: "Bank of Canada",
      isoCode: "CA",
    })
    const casaDaMoeda = await createIssuer({
      code: "casa-da-moeda",
      name: "Issuer",
      isoCode: "BR",
    })
    const royalMint = await createIssuer({
      code: "royal-mint",
      name: "Issuer",
      isoCode: "GB",
    })

    await expect(getIssuers()).resolves.toStrictEqual([
      {
        id: bankOfCanada.id,
        code: "bank-of-canada",
        name: "Bank of Canada",
        isoCode: "CA",
        createdAt: bankOfCanada.createdAt,
        updatedAt: bankOfCanada.updatedAt,
      },
      {
        id: casaDaMoeda.id,
        code: "casa-da-moeda",
        name: "Issuer",
        isoCode: "BR",
        createdAt: casaDaMoeda.createdAt,
        updatedAt: casaDaMoeda.updatedAt,
      },
      {
        id: royalMint.id,
        code: "royal-mint",
        name: "Issuer",
        isoCode: "GB",
        createdAt: royalMint.createdAt,
        updatedAt: royalMint.updatedAt,
      },
    ])
  })
})
