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
      name: "Bank of Canada",
    })
    await createIssuer({
      code: "casa-da-moeda",
      name: "Issuer",
    })
    await createIssuer({
      code: "royal-mint",
      name: "Issuer",
    })

    await expect(getIssuers()).resolves.toStrictEqual([
      {
        code: "bank-of-canada",
        name: "Bank of Canada",
      },
      {
        code: "casa-da-moeda",
        name: "Issuer",
      },
      {
        code: "royal-mint",
        name: "Issuer",
      },
    ])
  })
})
