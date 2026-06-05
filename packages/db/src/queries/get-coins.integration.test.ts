import { describe, expect, it } from "vitest"
import { db, getCoins } from "../index"
import {
  createCatalogue,
  createCoin,
  createCoinReference,
  createCoinRuler,
  createDistribution,
  createIssuer,
  createRuler,
  createRulerGroup,
} from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"

describe("getCoins integration", () => {
  useTestDatabaseIsolation(db)

  it("returns recent coins newest first", async () => {
    const athens = await createIssuer({
      code: "athens",
      name: "Athens",
    })

    await createCoin({
      title: "Earlier Owl",
      issuerId: athens.id,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    })
    await createCoin({
      title: "Latest Owl",
      issuerId: athens.id,
      createdAt: new Date("2026-01-03T00:00:00.000Z"),
    })
    await createCoin({
      title: "Middle Owl",
      issuerId: athens.id,
      createdAt: new Date("2026-01-02T00:00:00.000Z"),
    })

    await expect(getCoins()).resolves.toMatchObject([
      { title: "Latest Owl" },
      { title: "Middle Owl" },
      { title: "Earlier Owl" },
    ])
  })

  it("applies the default recent coin limit of 10", async () => {
    const rome = await createIssuer({
      code: "rome",
      name: "Rome",
    })
    const carthage = await createIssuer({
      code: "carthage",
      name: "Carthage",
    })

    for (let coinNumber = 1; coinNumber <= 12; coinNumber += 1) {
      const isRomanCoin = coinNumber % 2 === 1
      const issuerId = isRomanCoin ? rome.id : carthage.id
      const issuerLabel = isRomanCoin ? "Roman" : "Carthaginian"

      await createCoin({
        title: `${issuerLabel} Test Coin ${coinNumber}`,
        issuerId,
        createdAt: new Date(
          `2026-02-${String(coinNumber).padStart(2, "0")}T00:00:00.000Z`
        ),
      })
    }

    const recentCoins = await getCoins()

    expect(recentCoins).toHaveLength(10)
    expect(recentCoins.map(({ title }) => title)).toStrictEqual([
      "Carthaginian Test Coin 12",
      "Roman Test Coin 11",
      "Carthaginian Test Coin 10",
      "Roman Test Coin 9",
      "Carthaginian Test Coin 8",
      "Roman Test Coin 7",
      "Carthaginian Test Coin 6",
      "Roman Test Coin 5",
      "Carthaginian Test Coin 4",
      "Roman Test Coin 3",
    ])
  })

  it("returns full issuer data and an empty rulers array when a coin has no ruler attributions", async () => {
    const ancientWorld = await createIssuer({
      code: "ancient-world",
      name: "Ancient World",
    })
    const athens = await createIssuer({
      code: "athens",
      name: "Athens",
      parentIssuerId: ancientWorld.id,
    })
    const standardCirculation = await createDistribution({
      code: "standard-circulation",
      name: "Standard circulation",
    })
    const createdAt = new Date("2026-05-01T00:00:00.000Z")
    const coin = await createCoin({
      title: "Ungrouped Civic Issue",
      distributionId: standardCirculation.id,
      issuerId: athens.id,
      createdAt,
    })

    await expect(getCoins({ limit: 1 })).resolves.toStrictEqual([
      {
        id: coin.id,
        title: "Ungrouped Civic Issue",
        createdAt,
        updatedAt: createdAt,
        distribution: {
          id: standardCirculation.id,
          code: "standard-circulation",
          name: "Standard circulation",
          createdAt: standardCirculation.createdAt,
          updatedAt: standardCirculation.updatedAt,
        },
        issuer: {
          id: athens.id,
          code: "athens",
          name: "Athens",
          createdAt: athens.createdAt,
          updatedAt: athens.updatedAt,
          parent: {
            id: ancientWorld.id,
            code: "ancient-world",
            name: "Ancient World",
            createdAt: ancientWorld.createdAt,
            updatedAt: ancientWorld.updatedAt,
          },
        },
        references: [],
        rulers: [],
      },
    ])
  })

  it("returns the stored issue year range through the shared coin listing", async () => {
    const rome = await createIssuer({
      code: "rome",
      name: "Rome",
    })
    const coin = await createCoin({
      title: "Denarius of Caesar",
      issuerId: rome.id,
      minYear: -43,
      maxYear: -43,
      createdAt: new Date("2026-05-02T00:00:00.000Z"),
    })

    await expect(getCoins({ limit: 1 })).resolves.toMatchObject([
      {
        id: coin.id,
        title: "Denarius of Caesar",
        issueYearRange: {
          minYear: -43,
          maxYear: -43,
        },
      },
    ])
  })

  it("returns typed catalogue references sorted by catalogue title", async () => {
    const spain = await createIssuer({
      code: "spain",
      name: "Spain",
    })
    const standardCirculation = await createDistribution({
      code: "standard-circulation",
      name: "Standard circulation",
    })
    const standardCatalog = await createCatalogue({
      code: "KM",
      title: "Standard Catalog of World Coins",
    })
    const romanImperialCoinage = await createCatalogue({
      code: "RIC",
      title: "Roman Imperial Coinage",
    })
    const createdAt = new Date("2026-05-01T00:00:00.000Z")
    const coin = await createCoin({
      title: "Catalogue Reference Test Issue",
      distributionId: standardCirculation.id,
      issuerId: spain.id,
      createdAt,
    })

    const romanReference = await createCoinReference({
      coinId: coin.id,
      catalogueId: romanImperialCoinage.id,
      number: "K-12",
    })
    const kmReference = await createCoinReference({
      coinId: coin.id,
      catalogueId: standardCatalog.id,
      number: "1338A",
    })

    await expect(getCoins({ limit: 1 })).resolves.toStrictEqual([
      {
        id: coin.id,
        title: "Catalogue Reference Test Issue",
        createdAt,
        updatedAt: createdAt,
        distribution: {
          id: standardCirculation.id,
          code: "standard-circulation",
          name: "Standard circulation",
          createdAt: standardCirculation.createdAt,
          updatedAt: standardCirculation.updatedAt,
        },
        issuer: {
          id: spain.id,
          code: "spain",
          name: "Spain",
          createdAt: spain.createdAt,
          updatedAt: spain.updatedAt,
          parent: null,
        },
        rulers: [],
        references: [
          {
            id: romanReference.id,
            type: "catalogue",
            number: "K-12",
            createdAt: romanReference.createdAt,
            updatedAt: romanReference.updatedAt,
            catalogue: {
              id: romanImperialCoinage.id,
              code: "RIC",
              title: "Roman Imperial Coinage",
              createdAt: romanImperialCoinage.createdAt,
              updatedAt: romanImperialCoinage.updatedAt,
            },
          },
          {
            id: kmReference.id,
            type: "catalogue",
            number: "1338A",
            createdAt: kmReference.createdAt,
            updatedAt: kmReference.updatedAt,
            catalogue: {
              id: standardCatalog.id,
              code: "KM",
              title: "Standard Catalog of World Coins",
              createdAt: standardCatalog.createdAt,
              updatedAt: standardCatalog.updatedAt,
            },
          },
        ],
      },
    ])
  })

  it("filters coins by catalogue code and reference number prefix using the same matching reference", async () => {
    const spain = await createIssuer({
      code: "spain",
      name: "Spain",
    })
    const france = await createIssuer({
      code: "france",
      name: "France",
    })
    const standardCatalog = await createCatalogue({
      code: "KM",
      title: "Standard Catalog of World Coins",
    })
    const romanImperialCoinage = await createCatalogue({
      code: "RIC",
      title: "Roman Imperial Coinage",
    })

    const matchingCoin = await createCoin({
      title: "Spanish Matching KM Issue",
      issuerId: spain.id,
      createdAt: new Date("2026-05-06T00:00:00.000Z"),
    })
    const referenceOnlyMatchCoin = await createCoin({
      title: "French Reference Prefix Match",
      issuerId: france.id,
      createdAt: new Date("2026-05-05T00:00:00.000Z"),
    })
    const catalogueOnlyMatchCoin = await createCoin({
      title: "Spanish KM Other Number",
      issuerId: spain.id,
      createdAt: new Date("2026-05-04T00:00:00.000Z"),
    })
    const splitMatchCoin = await createCoin({
      title: "Split Reference Coin",
      issuerId: spain.id,
      createdAt: new Date("2026-05-03T00:00:00.000Z"),
    })
    const nonPrefixCoin = await createCoin({
      title: "Non Prefix Number Coin",
      issuerId: france.id,
      createdAt: new Date("2026-05-02T00:00:00.000Z"),
    })

    await createCoinReference({
      coinId: matchingCoin.id,
      catalogueId: standardCatalog.id,
      number: "  1338 A ",
    })
    await createCoinReference({
      coinId: referenceOnlyMatchCoin.id,
      catalogueId: romanImperialCoinage.id,
      number: "1338b",
    })
    await createCoinReference({
      coinId: catalogueOnlyMatchCoin.id,
      catalogueId: standardCatalog.id,
      number: "1400",
    })
    await createCoinReference({
      coinId: splitMatchCoin.id,
      catalogueId: standardCatalog.id,
      number: "2000",
    })
    await createCoinReference({
      coinId: splitMatchCoin.id,
      catalogueId: romanImperialCoinage.id,
      number: "1338c",
    })
    await createCoinReference({
      coinId: nonPrefixCoin.id,
      catalogueId: romanImperialCoinage.id,
      number: "21338",
    })

    await expect(getCoins({ catalogueCode: "km" })).resolves.toSatisfy(
      (coins: Array<{ title: string }>) =>
        coins.map(({ title }) => title).join("|") ===
        [
          "Spanish Matching KM Issue",
          "Spanish KM Other Number",
          "Split Reference Coin",
        ].join("|")
    )

    await expect(
      getCoins({
        referenceNumber: "1338 a",
      })
    ).resolves.toSatisfy(
      (coins: Array<{ title: string }>) =>
        coins.map(({ title }) => title).join("|") ===
        ["Spanish Matching KM Issue"].join("|")
    )

    await expect(
      getCoins({
        referenceNumber: "1338",
      })
    ).resolves.toSatisfy(
      (coins: Array<{ title: string }>) =>
        coins.map(({ title }) => title).join("|") ===
        [
          "Spanish Matching KM Issue",
          "French Reference Prefix Match",
          "Split Reference Coin",
        ].join("|")
    )

    await expect(
      getCoins({
        catalogueCode: "km",
        referenceNumber: "1338 a",
      })
    ).resolves.toSatisfy(
      (coins: Array<{ title: string }>) =>
        coins.map(({ title }) => title).join("|") ===
        ["Spanish Matching KM Issue"].join("|")
    )
  })

  it("filters coins by exact distribution code and composes with issuer, ruler, catalogue, and reference number filters", async () => {
    const spain = await createIssuer({
      code: "spain",
      name: "Spain",
    })
    const france = await createIssuer({
      code: "france",
      name: "France",
    })
    const standardCirculation = await createDistribution({
      code: "standard-circulation",
      name: "Standard circulation",
    })
    const circulatingCommemorative = await createDistribution({
      code: "circulating-commemorative",
      name: "Circulating commemorative",
    })
    const standardCatalog = await createCatalogue({
      code: "KM",
      title: "Standard Catalog of World Coins",
    })
    const felipe = await createRuler({
      code: "felipe-vi",
      name: "Felipe VI",
    })

    const matchingCoin = await createCoin({
      title: "Spanish Circulating Commemorative Match",
      distributionId: circulatingCommemorative.id,
      issuerId: spain.id,
      createdAt: new Date("2026-05-10T00:00:00.000Z"),
    })
    const wrongDistributionCoin = await createCoin({
      title: "Spanish Standard Circulation",
      distributionId: standardCirculation.id,
      issuerId: spain.id,
      createdAt: new Date("2026-05-09T00:00:00.000Z"),
    })
    const wrongIssuerCoin = await createCoin({
      title: "French Circulating Commemorative",
      distributionId: circulatingCommemorative.id,
      issuerId: france.id,
      createdAt: new Date("2026-05-08T00:00:00.000Z"),
    })
    const wrongRulerCoin = await createCoin({
      title: "Spanish Commemorative Without Ruler",
      distributionId: circulatingCommemorative.id,
      issuerId: spain.id,
      createdAt: new Date("2026-05-07T00:00:00.000Z"),
    })
    const wrongReferenceCoin = await createCoin({
      title: "Spanish Commemorative Wrong Reference",
      distributionId: circulatingCommemorative.id,
      issuerId: spain.id,
      createdAt: new Date("2026-05-06T00:00:00.000Z"),
    })

    await createCoinRuler({
      coinId: matchingCoin.id,
      rulerId: felipe.id,
      rulerOrder: 1,
    })
    await createCoinRuler({
      coinId: wrongDistributionCoin.id,
      rulerId: felipe.id,
      rulerOrder: 1,
    })

    await createCoinReference({
      coinId: matchingCoin.id,
      catalogueId: standardCatalog.id,
      number: "1338A",
    })
    await createCoinReference({
      coinId: wrongDistributionCoin.id,
      catalogueId: standardCatalog.id,
      number: "1338A",
    })
    await createCoinReference({
      coinId: wrongIssuerCoin.id,
      catalogueId: standardCatalog.id,
      number: "1338A",
    })
    await createCoinReference({
      coinId: wrongRulerCoin.id,
      catalogueId: standardCatalog.id,
      number: "1338A",
    })
    await createCoinReference({
      coinId: wrongReferenceCoin.id,
      catalogueId: standardCatalog.id,
      number: "2000",
    })

    await expect(
      getCoins({
        distributionCode: "circulating-commemorative",
      })
    ).resolves.toSatisfy((coins: Array<{ title: string }>) =>
      coins.map(({ title }) => title).join("|") ===
      [
        "Spanish Circulating Commemorative Match",
        "French Circulating Commemorative",
        "Spanish Commemorative Without Ruler",
        "Spanish Commemorative Wrong Reference",
      ].join("|")
    )

    await expect(
      getCoins({
        distributionCode: "circulating-commemorative",
        issuerCode: "spain",
        rulerCode: "felipe-vi",
        catalogueCode: "km",
        referenceNumber: "1338",
      })
    ).resolves.toSatisfy((coins: Array<{ title: string }>) =>
      coins.map(({ title }) => title).join("|") ===
      ["Spanish Circulating Commemorative Match"].join("|")
    )
  })

  it("ignores a blank distribution code filter instead of returning an empty result set", async () => {
    const spain = await createIssuer({
      code: "spain",
      name: "Spain",
    })
    const france = await createIssuer({
      code: "france",
      name: "France",
    })

    await createCoin({
      title: "Spanish Standard Issue",
      issuerId: spain.id,
      createdAt: new Date("2026-05-11T00:00:00.000Z"),
    })
    await createCoin({
      title: "French Standard Issue",
      issuerId: france.id,
      createdAt: new Date("2026-05-10T00:00:00.000Z"),
    })

    await expect(
      getCoins({
        distributionCode: "   ",
      })
    ).resolves.toMatchObject([
      { title: "Spanish Standard Issue" },
      { title: "French Standard Issue" },
    ])
  })

  it("returns full linked ruler data in ruler attribution order", async () => {
    const spain = await createIssuer({
      code: "spain",
      name: "Spain",
    })
    const standardCirculation = await createDistribution({
      code: "standard-circulation",
      name: "Standard circulation",
    })
    const bourbon = await createRulerGroup({
      code: "house-of-bourbon",
      name: "House of Bourbon",
    })
    const juanCarlos = await createRuler({
      code: "juan-carlos-i",
      name: "Juan Carlos I",
      rulerGroupId: bourbon.id,
    })
    const felipe = await createRuler({
      code: "felipe-vi",
      name: "Felipe VI",
      rulerGroupId: bourbon.id,
    })
    const liberty = await createRuler({
      code: "liberty",
      name: "Liberty",
    })
    const createdAt = new Date("2026-05-02T00:00:00.000Z")
    const coin = await createCoin({
      title: "Attribution Test Issue",
      distributionId: standardCirculation.id,
      issuerId: spain.id,
      createdAt,
    })

    await createCoinRuler({
      coinId: coin.id,
      rulerId: felipe.id,
      rulerOrder: 2,
    })
    await createCoinRuler({
      coinId: coin.id,
      rulerId: juanCarlos.id,
      rulerOrder: 1,
    })
    await createCoinRuler({
      coinId: coin.id,
      rulerId: liberty.id,
      rulerOrder: 3,
    })

    await expect(getCoins({ limit: 1 })).resolves.toStrictEqual([
      {
        id: coin.id,
        title: "Attribution Test Issue",
        createdAt,
        updatedAt: createdAt,
        distribution: {
          id: standardCirculation.id,
          code: "standard-circulation",
          name: "Standard circulation",
          createdAt: standardCirculation.createdAt,
          updatedAt: standardCirculation.updatedAt,
        },
        issuer: {
          id: spain.id,
          code: "spain",
          name: "Spain",
          createdAt: spain.createdAt,
          updatedAt: spain.updatedAt,
          parent: null,
        },
        rulers: [
          {
            id: juanCarlos.id,
            code: "juan-carlos-i",
            name: "Juan Carlos I",
            createdAt: juanCarlos.createdAt,
            updatedAt: juanCarlos.updatedAt,
            group: {
              id: bourbon.id,
              code: "house-of-bourbon",
              name: "House of Bourbon",
              createdAt: bourbon.createdAt,
              updatedAt: bourbon.updatedAt,
            },
          },
          {
            id: felipe.id,
            code: "felipe-vi",
            name: "Felipe VI",
            createdAt: felipe.createdAt,
            updatedAt: felipe.updatedAt,
            group: {
              id: bourbon.id,
              code: "house-of-bourbon",
              name: "House of Bourbon",
              createdAt: bourbon.createdAt,
              updatedAt: bourbon.updatedAt,
            },
          },
          {
            id: liberty.id,
            code: "liberty",
            name: "Liberty",
            createdAt: liberty.createdAt,
            updatedAt: liberty.updatedAt,
            group: null,
          },
        ],
      },
    ])
  })

  it("filters coins by exact ruler and combines issuer and ruler filters with AND semantics", async () => {
    const spain = await createIssuer({
      code: "spain",
      name: "Spain",
    })
    const france = await createIssuer({
      code: "france",
      name: "France",
    })
    const bourbon = await createRulerGroup({
      code: "house-of-bourbon",
      name: "House of Bourbon",
    })
    const felipe = await createRuler({
      code: "felipe-vi",
      name: "Felipe VI",
      rulerGroupId: bourbon.id,
    })
    const juanCarlos = await createRuler({
      code: "juan-carlos-i",
      name: "Juan Carlos I",
      rulerGroupId: bourbon.id,
    })
    const louis = await createRuler({
      code: "louis-xiv",
      name: "Louis XIV",
      rulerGroupId: bourbon.id,
    })

    const spanishFelipeCoin = await createCoin({
      title: "Spanish Felipe Issue",
      issuerId: spain.id,
      createdAt: new Date("2026-05-05T00:00:00.000Z"),
    })
    const spanishJuanCarlosCoin = await createCoin({
      title: "Spanish Juan Carlos Issue",
      issuerId: spain.id,
      createdAt: new Date("2026-05-04T00:00:00.000Z"),
    })
    const frenchLouisCoin = await createCoin({
      title: "French Louis Issue",
      issuerId: france.id,
      createdAt: new Date("2026-05-03T00:00:00.000Z"),
    })

    await createCoinRuler({
      coinId: spanishFelipeCoin.id,
      rulerId: felipe.id,
      rulerOrder: 1,
    })
    await createCoinRuler({
      coinId: spanishJuanCarlosCoin.id,
      rulerId: juanCarlos.id,
      rulerOrder: 1,
    })
    await createCoinRuler({
      coinId: frenchLouisCoin.id,
      rulerId: louis.id,
      rulerOrder: 1,
    })

    await expect(getCoins({ rulerCode: "felipe-vi" })).resolves.toMatchObject([
      {
        title: "Spanish Felipe Issue",
        issuer: {
          code: "spain",
        },
        rulers: [
          {
            code: "felipe-vi",
          },
        ],
      },
    ])

    await expect(
      getCoins({
        issuerCode: "spain",
        rulerCode: "felipe-vi",
      })
    ).resolves.toMatchObject([
      {
        title: "Spanish Felipe Issue",
      },
    ])

    await expect(
      getCoins({
        issuerCode: "france",
        rulerCode: "felipe-vi",
      })
    ).resolves.toStrictEqual([])

    await expect(
      getCoins({
        rulerCode: "unknown-ruler",
      })
    ).resolves.toStrictEqual([])
  })

  it("returns all ordered ruler attributions for a coin filtered by one matching ruler", async () => {
    const spain = await createIssuer({
      code: "spain",
      name: "Spain",
    })
    const bourbon = await createRulerGroup({
      code: "house-of-bourbon",
      name: "House of Bourbon",
    })
    const juanCarlos = await createRuler({
      code: "juan-carlos-i",
      name: "Juan Carlos I",
      rulerGroupId: bourbon.id,
    })
    const felipe = await createRuler({
      code: "felipe-vi",
      name: "Felipe VI",
      rulerGroupId: bourbon.id,
    })
    const coin = await createCoin({
      title: "Spanish Transitional Issue",
      issuerId: spain.id,
      createdAt: new Date("2026-05-06T00:00:00.000Z"),
    })

    await createCoinRuler({
      coinId: coin.id,
      rulerId: felipe.id,
      rulerOrder: 2,
    })
    await createCoinRuler({
      coinId: coin.id,
      rulerId: juanCarlos.id,
      rulerOrder: 1,
    })

    await expect(getCoins({ rulerCode: "felipe-vi" })).resolves.toMatchObject([
      {
        title: "Spanish Transitional Issue",
        rulers: [
          {
            code: "juan-carlos-i",
          },
          {
            code: "felipe-vi",
          },
        ],
      },
    ])
  })

  it("composes catalogue reference filters with issuer and ruler filters", async () => {
    const spain = await createIssuer({
      code: "spain",
      name: "Spain",
    })
    const france = await createIssuer({
      code: "france",
      name: "France",
    })
    const standardCatalog = await createCatalogue({
      code: "KM",
      title: "Standard Catalog of World Coins",
    })
    const bourbon = await createRulerGroup({
      code: "house-of-bourbon",
      name: "House of Bourbon",
    })
    const felipe = await createRuler({
      code: "felipe-vi",
      name: "Felipe VI",
      rulerGroupId: bourbon.id,
    })
    const louis = await createRuler({
      code: "louis-xiv",
      name: "Louis XIV",
      rulerGroupId: bourbon.id,
    })

    const matchingCoin = await createCoin({
      title: "Spanish Felipe KM 1338",
      issuerId: spain.id,
      createdAt: new Date("2026-05-07T00:00:00.000Z"),
    })
    const wrongIssuerCoin = await createCoin({
      title: "French Felipe KM 1338",
      issuerId: france.id,
      createdAt: new Date("2026-05-06T00:00:00.000Z"),
    })
    const wrongRulerCoin = await createCoin({
      title: "Spanish Louis KM 1338",
      issuerId: spain.id,
      createdAt: new Date("2026-05-05T00:00:00.000Z"),
    })

    await createCoinRuler({
      coinId: matchingCoin.id,
      rulerId: felipe.id,
      rulerOrder: 1,
    })
    await createCoinRuler({
      coinId: wrongIssuerCoin.id,
      rulerId: felipe.id,
      rulerOrder: 1,
    })
    await createCoinRuler({
      coinId: wrongRulerCoin.id,
      rulerId: louis.id,
      rulerOrder: 1,
    })

    await createCoinReference({
      coinId: matchingCoin.id,
      catalogueId: standardCatalog.id,
      number: "1338A",
    })
    await createCoinReference({
      coinId: wrongIssuerCoin.id,
      catalogueId: standardCatalog.id,
      number: "1338B",
    })
    await createCoinReference({
      coinId: wrongRulerCoin.id,
      catalogueId: standardCatalog.id,
      number: "1338C",
    })

    await expect(
      getCoins({
        catalogueCode: "km",
        issuerCode: "spain",
        referenceNumber: "1338",
        rulerCode: "felipe-vi",
      })
    ).resolves.toSatisfy(
      (coins: Array<{ title: string }>) =>
        coins.map(({ title }) => title).join("|") ===
        ["Spanish Felipe KM 1338"].join("|")
    )
  })

  it("returns the required nested distribution for each coin", async () => {
    const spain = await createIssuer({
      code: "spain",
      name: "Spain",
    })
    const standardCirculation = await createDistribution({
      code: "standard-circulation",
      name: "Standard circulation",
    })
    const createdAt = new Date("2026-05-01T00:00:00.000Z")
    const coin = await createCoin({
      title: "Distribution Test Issue",
      issuerId: spain.id,
      distributionId: standardCirculation.id,
      createdAt,
    })

    await expect(getCoins({ limit: 1 })).resolves.toStrictEqual([
      {
        id: coin.id,
        title: "Distribution Test Issue",
        createdAt,
        updatedAt: createdAt,
        distribution: {
          id: standardCirculation.id,
          code: "standard-circulation",
          name: "Standard circulation",
          createdAt: standardCirculation.createdAt,
          updatedAt: standardCirculation.updatedAt,
        },
        issuer: {
          id: spain.id,
          code: "spain",
          name: "Spain",
          createdAt: spain.createdAt,
          updatedAt: spain.updatedAt,
          parent: null,
        },
        references: [],
        rulers: [],
      },
    ])
  })
})
