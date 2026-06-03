import { describe, expect, it } from "vitest"
import { db, getCoins } from "../index"
import { createCoin, createIssuer } from "../testing/fixtures"
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
})
