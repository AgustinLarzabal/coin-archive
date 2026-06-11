import { describe, expect, it } from "vitest"
import { db } from "../index"
import { createIssuer } from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"
import { getIssuers } from "./get-issuers"

describe("getIssuers integration", () => {
  useTestDatabaseIsolation(db)

  it("returns issuer options sorted by name and code", async () => {
    await createIssuer({
      code: "bank-of-canada",
      isoCode: "CA",
      name: "Bank of Canada",
    })
    await createIssuer({
      code: "casa-da-moeda",
      isoCode: "BR",
      name: "Issuer",
    })
    await createIssuer({
      code: "royal-mint",
      isoCode: "GB",
      name: "Issuer",
    })

    await expect(getIssuers()).resolves.toStrictEqual([
      {
        code: "bank-of-canada",
        isoCode: "CA",
        name: "Bank of Canada",
      },
      {
        code: "casa-da-moeda",
        isoCode: "BR",
        name: "Issuer",
      },
      {
        code: "royal-mint",
        isoCode: "GB",
        name: "Issuer",
      },
    ])
  })
})
