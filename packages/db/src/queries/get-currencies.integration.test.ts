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
      fullName: "East Caribbean dollar",
      name: "Dollar",
    })
    const unitedStatesDollar = await createCurrency({
      code: "united-states-dollar",
      fullName: "United States dollar",
      name: "Dollar",
    })
    const zDollar = await createCurrency({
      code: "z-dollar",
      fullName: "Zimbabwe dollar",
      name: "Dollar",
    })
    const euro = await createCurrency({
      code: "euro",
      fullName: "Euro (2002-date)",
      name: "Euro",
    })

    await expect(getCurrencies()).resolves.toStrictEqual([
      {
        id: eastCaribbeanDollar.id,
        code: "east-caribbean-dollar",
        fullName: "East Caribbean dollar",
        name: "Dollar",
        createdAt: eastCaribbeanDollar.createdAt,
        updatedAt: eastCaribbeanDollar.updatedAt,
      },
      {
        id: unitedStatesDollar.id,
        code: "united-states-dollar",
        fullName: "United States dollar",
        name: "Dollar",
        createdAt: unitedStatesDollar.createdAt,
        updatedAt: unitedStatesDollar.updatedAt,
      },
      {
        id: zDollar.id,
        code: "z-dollar",
        fullName: "Zimbabwe dollar",
        name: "Dollar",
        createdAt: zDollar.createdAt,
        updatedAt: zDollar.updatedAt,
      },
      {
        id: euro.id,
        code: "euro",
        fullName: "Euro (2002-date)",
        name: "Euro",
        createdAt: euro.createdAt,
        updatedAt: euro.updatedAt,
      },
    ])
  })
})
