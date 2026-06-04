import { describe, expect, it } from "vitest"
import { db, getCoins } from "../index"
import {
  createCoin,
  createCoinRuler,
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
        issuerId: rome.id,
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
    const createdAt = new Date("2026-05-01T00:00:00.000Z")
    const coin = await createCoin({
      title: "Ungrouped Civic Issue",
      issuerId: athens.id,
      createdAt,
    })

    await expect(getCoins({ limit: 1 })).resolves.toStrictEqual([
      {
        id: coin.id,
        title: "Ungrouped Civic Issue",
        createdAt,
        updatedAt: createdAt,
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
        rulers: [],
      },
    ])
  })

  it("returns full linked ruler data in ruler attribution order", async () => {
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
    const liberty = await createRuler({
      code: "liberty",
      name: "Liberty",
    })
    const createdAt = new Date("2026-05-02T00:00:00.000Z")
    const coin = await createCoin({
      title: "Attribution Test Issue",
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
})
