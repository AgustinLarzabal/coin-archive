import { describe, expect, it } from "vitest"
import { db } from "../index"
import { createCurrency } from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"
import { getCurrencies } from "./get-currencies"

describe("getCurrencies integration", () => {
  useTestDatabaseIsolation(db)

  it("returns currency options sorted by name and code", async () => {
    const eastCaribbeanDollar = await createCurrency({
      code: "east-caribbean-dollar",
      name: "Dollar",
      fullName: "East Caribbean dollar",
    })
    const unitedStatesDollar = await createCurrency({
      code: "united-states-dollar",
      name: "Dollar",
      fullName: "United States dollar",
    })
    const zDollar = await createCurrency({
      code: "z-dollar",
      name: "Dollar",
      fullName: "Zimbabwe dollar",
    })
    const euro = await createCurrency({
      code: "euro",
      name: "Euro",
      fullName: "Euro (2002-date)",
    })

    await expect(getCurrencies()).resolves.toStrictEqual([
      {
        id: eastCaribbeanDollar.id,
        code: "east-caribbean-dollar",
        name: "Dollar",
        fullName: "East Caribbean dollar",
        createdAt: eastCaribbeanDollar.createdAt,
        updatedAt: eastCaribbeanDollar.updatedAt,
      },
      {
        id: unitedStatesDollar.id,
        code: "united-states-dollar",
        name: "Dollar",
        fullName: "United States dollar",
        createdAt: unitedStatesDollar.createdAt,
        updatedAt: unitedStatesDollar.updatedAt,
      },
      {
        id: zDollar.id,
        code: "z-dollar",
        name: "Dollar",
        fullName: "Zimbabwe dollar",
        createdAt: zDollar.createdAt,
        updatedAt: zDollar.updatedAt,
      },
      {
        id: euro.id,
        code: "euro",
        name: "Euro",
        fullName: "Euro (2002-date)",
        createdAt: euro.createdAt,
        updatedAt: euro.updatedAt,
      },
    ])
  })
})
