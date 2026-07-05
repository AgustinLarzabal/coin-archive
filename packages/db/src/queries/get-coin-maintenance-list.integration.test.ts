import { describe, expect, it } from "vitest"

import { db, getCoinMaintenanceList } from "../index"
import {
  createCoin,
  createCoinRuler,
  createComposition,
  createCurrency,
  createDistribution,
  createIssuer,
  createRuler,
} from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"

describe("getCoinMaintenanceList integration", () => {
  useTestDatabaseIsolation(db)

  it("returns a paginated maintenance list sorted by recent updates with title search and core filters", async () => {
    const spain = await createIssuer({
      code: "spain",
      name: "Spain",
      isoCode: "ES",
    })
    const france = await createIssuer({
      code: "france",
      name: "France",
      isoCode: "FR",
    })
    const charlesIii = await createRuler({
      code: "charles-iii",
      name: "Charles III",
    })
    const louisXiv = await createRuler({
      code: "louis-xiv",
      name: "Louis XIV",
    })
    const standardCirculation = await createDistribution({
      code: "standard-circulation",
      name: "Standard circulation",
    })
    const commemorative = await createDistribution({
      code: "commemorative",
      name: "Commemorative",
    })
    const euro = await createCurrency({
      code: "euro",
      name: "Euro",
      fullName: "Euro",
    })
    const peso = await createCurrency({
      code: "argentine-peso",
      name: "Peso",
      fullName: "Argentine peso",
    })
    const silver = await createComposition({
      code: "silver-900",
      name: "Silver .900",
    })
    const gold = await createComposition({
      code: "gold-900",
      name: "Gold .900",
    })

    const olderSpanishCoin = await createCoin({
      title: "Older Spanish Coin",
      issuerId: spain.id,
      distributionId: standardCirculation.id,
      currencyId: euro.id,
      compositionId: silver.id,
      faceValueText: "1 Euro",
      minYear: 1999,
      maxYear: 2001,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-02-01T00:00:00.000Z"),
    })
    await createCoinRuler({
      coinId: olderSpanishCoin.id,
      rulerId: charlesIii.id,
      rulerOrder: 1,
    })

    const latestFrenchCoin = await createCoin({
      title: "Latest French Coin",
      issuerId: france.id,
      distributionId: commemorative.id,
      currencyId: peso.id,
      compositionId: gold.id,
      faceValueText: "50 Pesos",
      minYear: 2020,
      maxYear: 2020,
      createdAt: new Date("2026-01-02T00:00:00.000Z"),
      updatedAt: new Date("2026-03-01T00:00:00.000Z"),
    })
    await createCoinRuler({
      coinId: latestFrenchCoin.id,
      rulerId: louisXiv.id,
      rulerOrder: 1,
    })

    const newerSpanishCoin = await createCoin({
      title: "Newer Spanish Coin",
      issuerId: spain.id,
      distributionId: standardCirculation.id,
      currencyId: euro.id,
      compositionId: silver.id,
      faceValueText: "2 Euro",
      minYear: 2002,
      maxYear: 2004,
      createdAt: new Date("2026-01-03T00:00:00.000Z"),
      updatedAt: new Date("2026-02-01T00:00:00.000Z"),
    })
    await createCoinRuler({
      coinId: newerSpanishCoin.id,
      rulerId: charlesIii.id,
      rulerOrder: 1,
    })

    await expect(getCoinMaintenanceList()).resolves.toMatchObject({
      items: [
        {
          id: latestFrenchCoin.id,
          title: "Latest French Coin",
          issuer: { code: "france", name: "France" },
          minYear: 2020,
          maxYear: 2020,
          faceValue: {
            text: "50 Pesos",
            currency: { code: "argentine-peso", name: "Peso" },
          },
          distribution: {
            code: "commemorative",
            name: "Commemorative",
          },
          composition: {
            code: "gold-900",
            name: "Gold .900",
          },
          updatedAt: new Date("2026-03-01T00:00:00.000Z"),
        },
        {
          id: newerSpanishCoin.id,
          title: "Newer Spanish Coin",
        },
        {
          id: olderSpanishCoin.id,
          title: "Older Spanish Coin",
        },
      ],
      page: 1,
      pageSize: 50,
      totalItems: 3,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    })

    await expect(
      getCoinMaintenanceList({
        compositionCode: "  SILVER-900  ",
        currencyCode: "euro",
        distributionCode: "standard-circulation",
        issuerCode: "spain",
        page: 2,
        pageSize: 1,
        rulerCode: "charles-iii",
        titleQuery: "  spanish ",
      })
    ).resolves.toMatchObject({
      items: [
        {
          id: olderSpanishCoin.id,
          title: "Older Spanish Coin",
          issuer: { code: "spain", name: "Spain" },
          minYear: 1999,
          maxYear: 2001,
          faceValue: {
            text: "1 Euro",
            currency: { code: "euro", name: "Euro" },
          },
          distribution: {
            code: "standard-circulation",
            name: "Standard circulation",
          },
          composition: {
            code: "silver-900",
            name: "Silver .900",
          },
        },
      ],
      page: 2,
      pageSize: 1,
      totalItems: 2,
      totalPages: 2,
      hasNextPage: false,
      hasPreviousPage: true,
    })
  })
})
