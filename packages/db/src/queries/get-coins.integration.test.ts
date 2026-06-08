import { describe, expect, it } from "vitest"
import { db, getCoins } from "../index"
import {
  createCatalogue,
  createCoin,
  createCoinReference,
  createCoinRuler,
  createComposition,
  createCurrency,
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
    const silver900 = await createComposition({
      code: "silver-900",
      description: "Ninety percent silver alloy.",
      name: "Silver (.900)",
    })
    const euro = await createCurrency({
      code: "euro",
      fullName: "Euro (2002-date)",
      name: "Euro",
    })
    const createdAt = new Date("2026-05-01T00:00:00.000Z")
    const coin = await createCoin({
      title: "Ungrouped Civic Issue",
      compositionId: silver900.id,
      currencyId: euro.id,
      distributionId: standardCirculation.id,
      faceValueNumericValue: 2,
      faceValueText: "2 Euros",
      issuerId: athens.id,
      createdAt,
    })

    await expect(getCoins({ limit: 1 })).resolves.toStrictEqual([
      {
        id: coin.id,
        title: "Ungrouped Civic Issue",
        createdAt,
        updatedAt: createdAt,
        issueYearRange: null,
        faceValue: {
          text: "2 Euros",
          numericValue: 2,
          currency: {
            id: euro.id,
            code: "euro",
            name: "Euro",
            fullName: "Euro (2002-date)",
            createdAt: euro.createdAt,
            updatedAt: euro.updatedAt,
          },
        },
        measurements: {
          weight: null,
          diameter: null,
          thickness: null,
        },
        composition: {
          id: silver900.id,
          code: "silver-900",
          name: "Silver (.900)",
          description: "Ninety percent silver alloy.",
          createdAt: silver900.createdAt,
          updatedAt: silver900.updatedAt,
        },
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

  it("returns grouped measurements and filters weight, diameter, and thickness ranges while excluding unknown values only for the filtered measurement", async () => {
    const rome = await createIssuer({
      code: "rome",
      name: "Rome",
    })

    const measuredMatch = await createCoin({
      title: "Measured Match",
      issuerId: rome.id,
      weight: 4.5,
      diameter: 19.25,
      thickness: 1.75,
      createdAt: new Date("2026-05-06T00:00:00.000Z"),
    })
    await createCoin({
      title: "Measured Miss",
      issuerId: rome.id,
      weight: 2.75,
      diameter: 17.0,
      thickness: 1.2,
      createdAt: new Date("2026-05-05T00:00:00.000Z"),
    })
    await createCoin({
      title: "Unknown Weight",
      issuerId: rome.id,
      diameter: 21.0,
      thickness: 2.0,
      createdAt: new Date("2026-05-04T00:00:00.000Z"),
    })

    await expect(getCoins({ limit: 3 })).resolves.toMatchObject([
      {
        id: measuredMatch.id,
        title: "Measured Match",
        measurements: {
          weight: 4.5,
          diameter: 19.25,
          thickness: 1.75,
        },
      },
      {
        title: "Measured Miss",
        measurements: {
          weight: 2.75,
          diameter: 17,
          thickness: 1.2,
        },
      },
      {
        title: "Unknown Weight",
        measurements: {
          weight: null,
          diameter: 21,
          thickness: 2,
        },
      },
    ])

    await expect(
      getCoins({
        minWeight: 4,
        maxWeight: 5,
      })
    ).resolves.toSatisfy((coins: Array<{ title: string }>) =>
      coins.map(({ title }) => title).join("|") === ["Measured Match"].join("|")
    )

    await expect(
      getCoins({
        minDiameter: 18,
        maxDiameter: 20,
      })
    ).resolves.toSatisfy((coins: Array<{ title: string }>) =>
      coins.map(({ title }) => title).join("|") === ["Measured Match"].join("|")
    )

    await expect(
      getCoins({
        minThickness: 1.5,
      })
    ).resolves.toSatisfy((coins: Array<{ title: string }>) =>
      coins.map(({ title }) => title).join("|") ===
      ["Measured Match", "Unknown Weight"].join("|")
    )
  })

  it("combines measurement filtering with existing homepage filters using AND semantics and keeps newest-first ordering", async () => {
    const rome = await createIssuer({
      code: "rome",
      name: "Rome",
    })
    const athens = await createIssuer({
      code: "athens",
      name: "Athens",
    })
    const standardCirculation = await createDistribution({
      code: "standard-circulation",
      name: "Standard circulation",
    })
    const commemorative = await createDistribution({
      code: "commemorative",
      name: "Commemorative",
    })
    const romanImperialCoinage = await createCatalogue({
      code: "RIC",
      title: "Roman Imperial Coinage",
    })
    const augustus = await createRuler({
      code: "augustus",
      name: "Augustus",
    })

    const latestMatchingCoin = await createCoin({
      title: "Latest Matching Measured Coin",
      issuerId: rome.id,
      distributionId: standardCirculation.id,
      minYear: -5,
      maxYear: 5,
      weight: 4.5,
      diameter: 19.25,
      thickness: 1.75,
      createdAt: new Date("2026-05-06T00:00:00.000Z"),
    })
    const earlierMatchingCoin = await createCoin({
      title: "Earlier Matching Measured Coin",
      issuerId: rome.id,
      distributionId: standardCirculation.id,
      minYear: -5,
      maxYear: 5,
      weight: 4.75,
      diameter: 19.5,
      thickness: 1.8,
      createdAt: new Date("2026-05-05T00:00:00.000Z"),
    })
    const issuerMiss = await createCoin({
      title: "Issuer Miss",
      issuerId: athens.id,
      distributionId: standardCirculation.id,
      minYear: -5,
      maxYear: 5,
      weight: 4.5,
      diameter: 19.25,
      thickness: 1.75,
      createdAt: new Date("2026-05-04T00:00:00.000Z"),
    })
    const distributionMiss = await createCoin({
      title: "Distribution Miss",
      issuerId: rome.id,
      distributionId: commemorative.id,
      minYear: -5,
      maxYear: 5,
      weight: 4.5,
      diameter: 19.25,
      thickness: 1.75,
      createdAt: new Date("2026-05-03T00:00:00.000Z"),
    })
    const yearMiss = await createCoin({
      title: "Year Miss",
      issuerId: rome.id,
      distributionId: standardCirculation.id,
      minYear: 6,
      maxYear: 8,
      weight: 4.5,
      diameter: 19.25,
      thickness: 1.75,
      createdAt: new Date("2026-05-02T00:00:00.000Z"),
    })
    const measurementMiss = await createCoin({
      title: "Measurement Miss",
      issuerId: rome.id,
      distributionId: standardCirculation.id,
      minYear: -5,
      maxYear: 5,
      weight: 2.5,
      diameter: 17,
      thickness: 1.1,
      createdAt: new Date("2026-05-01T00:00:00.000Z"),
    })
    const referenceMiss = await createCoin({
      title: "Reference Miss",
      issuerId: rome.id,
      distributionId: standardCirculation.id,
      minYear: -5,
      maxYear: 5,
      weight: 4.5,
      diameter: 19.25,
      thickness: 1.75,
      createdAt: new Date("2026-04-30T00:00:00.000Z"),
    })
    const rulerMiss = await createCoin({
      title: "Ruler Miss",
      issuerId: rome.id,
      distributionId: standardCirculation.id,
      minYear: -5,
      maxYear: 5,
      weight: 4.5,
      diameter: 19.25,
      thickness: 1.75,
      createdAt: new Date("2026-04-29T00:00:00.000Z"),
    })

    await createCoinReference({
      coinId: latestMatchingCoin.id,
      catalogueId: romanImperialCoinage.id,
      number: "12A",
    })
    await createCoinReference({
      coinId: earlierMatchingCoin.id,
      catalogueId: romanImperialCoinage.id,
      number: "12B",
    })
    await createCoinReference({
      coinId: referenceMiss.id,
      catalogueId: romanImperialCoinage.id,
      number: "14A",
    })
    await createCoinRuler({
      coinId: latestMatchingCoin.id,
      rulerId: augustus.id,
      rulerOrder: 1,
    })
    await createCoinRuler({
      coinId: earlierMatchingCoin.id,
      rulerId: augustus.id,
      rulerOrder: 1,
    })
    await createCoinRuler({
      coinId: rulerMiss.id,
      rulerId: (await createRuler({
        code: "tiberius",
        name: "Tiberius",
      })).id,
      rulerOrder: 1,
    })

    await expect(
      getCoins({
        issuerCode: "rome",
        distributionCode: "standard-circulation",
        catalogueCode: "RIC",
        referenceNumber: "12",
        rulerCode: "augustus",
        fromYear: 0,
        toYear: 0,
        minWeight: 4,
        maxWeight: 5,
        minDiameter: 19,
        maxDiameter: 20,
        minThickness: 1.7,
        maxThickness: 2,
      })
    ).resolves.toSatisfy((coins: Array<{ title: string }>) =>
      coins.map(({ title }) => title).join("|") ===
      [
        "Latest Matching Measured Coin",
        "Earlier Matching Measured Coin",
      ].join("|")
    )
  })

  it("filters coins by a requested single issue year using overlap semantics and excludes unknown ranges", async () => {
    const rome = await createIssuer({
      code: "rome",
      name: "Rome",
    })

    await createCoin({
      title: "Exact Year Match",
      issuerId: rome.id,
      minYear: 1900,
      maxYear: 1900,
      createdAt: new Date("2026-05-06T00:00:00.000Z"),
    })
    await createCoin({
      title: "Overlapping Multi Year Match",
      issuerId: rome.id,
      minYear: 1898,
      maxYear: 1902,
      createdAt: new Date("2026-05-05T00:00:00.000Z"),
    })
    await createCoin({
      title: "Non Overlapping Range",
      issuerId: rome.id,
      minYear: 1901,
      maxYear: 1903,
      createdAt: new Date("2026-05-04T00:00:00.000Z"),
    })
    await createCoin({
      title: "Unknown Issue Years",
      issuerId: rome.id,
      createdAt: new Date("2026-05-03T00:00:00.000Z"),
    })

    await expect(
      getCoins({
        fromYear: 1900,
        toYear: 1900,
      })
    ).resolves.toSatisfy((coins: Array<{ title: string }>) =>
      coins.map(({ title }) => title).join("|") ===
      ["Exact Year Match", "Overlapping Multi Year Match"].join("|")
    )
  })

  it("filters coins by open-ended issue year bounds", async () => {
    const rome = await createIssuer({
      code: "rome",
      name: "Rome",
    })

    await createCoin({
      title: "Earlier Range",
      issuerId: rome.id,
      minYear: 1800,
      maxYear: 1850,
      createdAt: new Date("2026-05-06T00:00:00.000Z"),
    })
    await createCoin({
      title: "Later Range",
      issuerId: rome.id,
      minYear: 1900,
      maxYear: 1950,
      createdAt: new Date("2026-05-05T00:00:00.000Z"),
    })
    await createCoin({
      title: "Crossing Range",
      issuerId: rome.id,
      minYear: 1850,
      maxYear: 1905,
      createdAt: new Date("2026-05-04T00:00:00.000Z"),
    })

    await expect(
      getCoins({
        fromYear: 1900,
      })
    ).resolves.toSatisfy((coins: Array<{ title: string }>) =>
      coins.map(({ title }) => title).join("|") ===
      ["Later Range", "Crossing Range"].join("|")
    )

    await expect(
      getCoins({
        toYear: 1850,
      })
    ).resolves.toSatisfy((coins: Array<{ title: string }>) =>
      coins.map(({ title }) => title).join("|") ===
      ["Earlier Range", "Crossing Range"].join("|")
    )
  })

  it("filters issue year windows across astronomical years including negative years and 0", async () => {
    const rome = await createIssuer({
      code: "rome",
      name: "Rome",
    })

    await createCoin({
      title: "Late Republic Range",
      issuerId: rome.id,
      minYear: -43,
      maxYear: -40,
      createdAt: new Date("2026-05-06T00:00:00.000Z"),
    })
    await createCoin({
      title: "BCE To CE Transition Range",
      issuerId: rome.id,
      minYear: -2,
      maxYear: 1,
      createdAt: new Date("2026-05-05T00:00:00.000Z"),
    })
    await createCoin({
      title: "Early Empire Range",
      issuerId: rome.id,
      minYear: 5,
      maxYear: 10,
      createdAt: new Date("2026-05-04T00:00:00.000Z"),
    })
    await createCoin({
      title: "Unknown Issue Years",
      issuerId: rome.id,
      createdAt: new Date("2026-05-03T00:00:00.000Z"),
    })

    await expect(
      getCoins({
        fromYear: -1,
        toYear: 0,
      })
    ).resolves.toSatisfy((coins: Array<{ title: string }>) =>
      coins.map(({ title }) => title).join("|") ===
      ["BCE To CE Transition Range"].join("|")
    )

    await expect(
      getCoins({
        fromYear: 0,
      })
    ).resolves.toSatisfy((coins: Array<{ title: string }>) =>
      coins.map(({ title }) => title).join("|") ===
      ["BCE To CE Transition Range", "Early Empire Range"].join("|")
    )

    await expect(
      getCoins({
        toYear: -40,
      })
    ).resolves.toSatisfy((coins: Array<{ title: string }>) =>
      coins.map(({ title }) => title).join("|") ===
      ["Late Republic Range"].join("|")
    )
  })

  it("combines issue year range filtering with existing homepage filters using AND semantics", async () => {
    const spain = await createIssuer({
      code: "spain",
      name: "Spain",
    })
    const france = await createIssuer({
      code: "france",
      name: "France",
    })

    await createCoin({
      title: "Spanish Overlapping Match",
      issuerId: spain.id,
      minYear: 1898,
      maxYear: 1902,
      createdAt: new Date("2026-05-06T00:00:00.000Z"),
    })
    await createCoin({
      title: "Spanish Non Overlapping",
      issuerId: spain.id,
      minYear: 1903,
      maxYear: 1904,
      createdAt: new Date("2026-05-05T00:00:00.000Z"),
    })
    await createCoin({
      title: "French Overlapping",
      issuerId: france.id,
      minYear: 1898,
      maxYear: 1902,
      createdAt: new Date("2026-05-04T00:00:00.000Z"),
    })

    await expect(
      getCoins({
        fromYear: 1900,
        toYear: 1900,
        issuerCode: "spain",
      })
    ).resolves.toSatisfy((coins: Array<{ title: string }>) =>
      coins.map(({ title }) => title).join("|") ===
      ["Spanish Overlapping Match"].join("|")
    )
  })

  it("combines issue year range filtering with ruler filters using AND semantics", async () => {
    const rome = await createIssuer({
      code: "rome",
      name: "Rome",
    })
    const augustus = await createRuler({
      code: "augustus",
      name: "Augustus",
    })
    const tiberius = await createRuler({
      code: "tiberius",
      name: "Tiberius",
    })

    const augustusMatch = await createCoin({
      title: "Augustus Overlapping Match",
      issuerId: rome.id,
      minYear: -5,
      maxYear: 5,
      createdAt: new Date("2026-05-06T00:00:00.000Z"),
    })
    const augustusMiss = await createCoin({
      title: "Augustus Non Overlapping",
      issuerId: rome.id,
      minYear: 6,
      maxYear: 8,
      createdAt: new Date("2026-05-05T00:00:00.000Z"),
    })
    const tiberiusMatch = await createCoin({
      title: "Tiberius Overlapping",
      issuerId: rome.id,
      minYear: -5,
      maxYear: 5,
      createdAt: new Date("2026-05-04T00:00:00.000Z"),
    })

    await createCoinRuler({
      coinId: augustusMatch.id,
      rulerId: augustus.id,
      rulerOrder: 1,
    })
    await createCoinRuler({
      coinId: augustusMiss.id,
      rulerId: augustus.id,
      rulerOrder: 1,
    })
    await createCoinRuler({
      coinId: tiberiusMatch.id,
      rulerId: tiberius.id,
      rulerOrder: 1,
    })

    await expect(
      getCoins({
        fromYear: 0,
        toYear: 0,
        rulerCode: "augustus",
      })
    ).resolves.toSatisfy((coins: Array<{ title: string }>) =>
      coins.map(({ title }) => title).join("|") ===
      ["Augustus Overlapping Match"].join("|")
    )
  })

  it("combines issue year range filtering with distribution filters using AND semantics", async () => {
    const rome = await createIssuer({
      code: "rome",
      name: "Rome",
    })
    const standardCirculation = await createDistribution({
      code: "standard-circulation",
      name: "Standard circulation",
    })
    const commemorative = await createDistribution({
      code: "commemorative",
      name: "Commemorative",
    })

    await createCoin({
      title: "Circulation Overlapping Match",
      distributionId: standardCirculation.id,
      issuerId: rome.id,
      minYear: 1898,
      maxYear: 1902,
      createdAt: new Date("2026-05-06T00:00:00.000Z"),
    })
    await createCoin({
      title: "Circulation Non Overlapping",
      distributionId: standardCirculation.id,
      issuerId: rome.id,
      minYear: 1903,
      maxYear: 1904,
      createdAt: new Date("2026-05-05T00:00:00.000Z"),
    })
    await createCoin({
      title: "Commemorative Overlapping",
      distributionId: commemorative.id,
      issuerId: rome.id,
      minYear: 1898,
      maxYear: 1902,
      createdAt: new Date("2026-05-04T00:00:00.000Z"),
    })

    await expect(
      getCoins({
        fromYear: 1900,
        toYear: 1900,
        distributionCode: "standard-circulation",
      })
    ).resolves.toSatisfy((coins: Array<{ title: string }>) =>
      coins.map(({ title }) => title).join("|") ===
      ["Circulation Overlapping Match"].join("|")
    )
  })

  it("combines issue year range filtering with catalogue and reference number filters using AND semantics", async () => {
    const rome = await createIssuer({
      code: "rome",
      name: "Rome",
    })
    const romanImperialCoinage = await createCatalogue({
      code: "RIC",
      title: "Roman Imperial Coinage",
    })
    const standardCatalog = await createCatalogue({
      code: "KM",
      title: "Standard Catalog of World Coins",
    })

    const matchingRicCoin = await createCoin({
      title: "RIC Overlapping Match",
      issuerId: rome.id,
      minYear: 1898,
      maxYear: 1902,
      createdAt: new Date("2026-05-06T00:00:00.000Z"),
    })
    const nonMatchingYearRicCoin = await createCoin({
      title: "RIC Non Overlapping",
      issuerId: rome.id,
      minYear: 1903,
      maxYear: 1904,
      createdAt: new Date("2026-05-05T00:00:00.000Z"),
    })
    const matchingKmCoin = await createCoin({
      title: "KM Overlapping",
      issuerId: rome.id,
      minYear: 1898,
      maxYear: 1902,
      createdAt: new Date("2026-05-04T00:00:00.000Z"),
    })
    const referenceMatch = await createCoin({
      title: "Reference Overlapping Match",
      issuerId: rome.id,
      minYear: 1898,
      maxYear: 1902,
      createdAt: new Date("2026-05-03T00:00:00.000Z"),
    })
    const referenceMiss = await createCoin({
      title: "Reference Different Prefix",
      issuerId: rome.id,
      minYear: 1898,
      maxYear: 1902,
      createdAt: new Date("2026-05-02T00:00:00.000Z"),
    })

    await createCoinReference({
      coinId: matchingRicCoin.id,
      catalogueId: romanImperialCoinage.id,
      number: "12A",
    })
    await createCoinReference({
      coinId: nonMatchingYearRicCoin.id,
      catalogueId: romanImperialCoinage.id,
      number: "12B",
    })
    await createCoinReference({
      coinId: matchingKmCoin.id,
      catalogueId: standardCatalog.id,
      number: "12A",
    })
    await createCoinReference({
      coinId: referenceMatch.id,
      catalogueId: romanImperialCoinage.id,
      number: "1338A",
    })
    await createCoinReference({
      coinId: referenceMiss.id,
      catalogueId: romanImperialCoinage.id,
      number: "1444",
    })

    await expect(
      getCoins({
        catalogueCode: "RIC",
        fromYear: 1900,
        toYear: 1900,
      })
    ).resolves.toSatisfy((coins: Array<{ title: string }>) =>
      coins.map(({ title }) => title).join("|") ===
      [
        "RIC Overlapping Match",
        "Reference Overlapping Match",
        "Reference Different Prefix",
      ].join("|")
    )

    await expect(
      getCoins({
        fromYear: 1900,
        toYear: 1900,
        referenceNumber: "1338",
      })
    ).resolves.toSatisfy((coins: Array<{ title: string }>) =>
      coins.map(({ title }) => title).join("|") ===
      ["Reference Overlapping Match"].join("|")
    )
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
        issueYearRange: null,
        faceValue: {
          text: "1 Test Unit",
          numericValue: 1,
          currency: {
            id: expect.any(String),
            code: "test-unit",
            name: "Test Unit",
            fullName: "Test Unit",
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
          },
        },
        measurements: {
          weight: null,
          diameter: null,
          thickness: null,
        },
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

  it("filters coins by exact composition code and combines the composition filter with existing filters using AND semantics", async () => {
    const spain = await createIssuer({
      code: "spain",
      name: "Spain",
    })
    const france = await createIssuer({
      code: "france",
      name: "France",
    })
    const silver900 = await createComposition({
      code: "silver-900",
      description: "Ninety percent silver alloy.",
      name: "Silver (.900)",
    })
    const copperNickel = await createComposition({
      code: "copper-nickel",
      name: "Copper-nickel",
    })
    const circulatingCommemorative = await createDistribution({
      code: "circulating-commemorative",
      name: "Circulating commemorative",
    })

    await createCoin({
      title: "Spanish Silver Match",
      compositionId: silver900.id,
      distributionId: circulatingCommemorative.id,
      issuerId: spain.id,
      createdAt: new Date("2026-05-11T00:00:00.000Z"),
    })
    await createCoin({
      title: "French Silver Coin",
      compositionId: silver900.id,
      distributionId: circulatingCommemorative.id,
      issuerId: france.id,
      createdAt: new Date("2026-05-10T00:00:00.000Z"),
    })
    await createCoin({
      title: "Spanish Copper-Nickel Coin",
      compositionId: copperNickel.id,
      distributionId: circulatingCommemorative.id,
      issuerId: spain.id,
      createdAt: new Date("2026-05-09T00:00:00.000Z"),
    })

    await expect(
      getCoins({
        compositionCode: "SILVER-900",
      })
    ).resolves.toSatisfy((coins: Array<{ title: string }>) =>
      coins.map(({ title }) => title).join("|") ===
      ["Spanish Silver Match", "French Silver Coin"].join("|")
    )

    await expect(
      getCoins({
        compositionCode: "silver-900",
        distributionCode: "circulating-commemorative",
        issuerCode: "spain",
      })
    ).resolves.toSatisfy((coins: Array<{ title: string }>) =>
      coins.map(({ title }) => title).join("|") ===
      ["Spanish Silver Match"].join("|")
    )
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
        issueYearRange: null,
        faceValue: {
          text: "1 Test Unit",
          numericValue: 1,
          currency: {
            id: expect.any(String),
            code: "test-unit",
            name: "Test Unit",
            fullName: "Test Unit",
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
          },
        },
        measurements: {
          weight: null,
          diameter: null,
          thickness: null,
        },
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
        issueYearRange: null,
        faceValue: {
          text: "1 Test Unit",
          numericValue: 1,
          currency: {
            id: expect.any(String),
            code: "test-unit",
            name: "Test Unit",
            fullName: "Test Unit",
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
          },
        },
        measurements: {
          weight: null,
          diameter: null,
          thickness: null,
        },
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
