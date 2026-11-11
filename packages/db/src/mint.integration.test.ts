import { eq, sql } from "drizzle-orm"
import { drizzle } from "drizzle-orm/node-postgres"
import { migrate } from "drizzle-orm/node-postgres/migrator"
import { Pool } from "pg"
import { beforeEach, describe, expect, it } from "vitest"

import { createDatabase, readCoinSeed, seedCoins } from "./index.js"

const databaseUrl = process.env.DATABASE_URL ?? ""

beforeEach(async () => {
  const pool = new Pool({ connectionString: databaseUrl })
  try {
    await pool.query(
      "drop schema if exists drizzle cascade; drop schema public cascade; create schema public"
    )
    await migrate(drizzle(pool), { migrationsFolder: "drizzle" })
  } finally {
    await pool.end()
  }
})

describe("confirmed Coin Mints", () => {
  it("keeps Mint countries independent and returns zero, multiple, and shared associations", async () => {
    const database = createDatabase(databaseUrl)
    try {
      const [italy, vatican] = await database.orm
        .insert(database.schema.issuers)
        .values([
          { name: "Italy", code: "IT" },
          { name: "Vatican City", code: "VA" },
        ])
        .returning()
      const [firstCoin, secondCoin, unassignedCoin] = await database.orm
        .insert(database.schema.coins)
        .values([
          {
            title: "First",
            issuerId: vatican.id,
            distributionId: sql`(select id from distributions where slug = 'circulating-commemorative')`,
            firstIssueYear: 2004,
            lastIssueYear: 2004,
          },
          {
            title: "Second",
            issuerId: italy.id,
            distributionId: sql`(select id from distributions where slug = 'circulating-commemorative')`,
            firstIssueYear: 2004,
            lastIssueYear: 2004,
          },
          {
            title: "Unassigned",
            issuerId: italy.id,
            distributionId: sql`(select id from distributions where slug = 'circulating-commemorative')`,
            firstIssueYear: 2004,
            lastIssueYear: 2004,
          },
        ])
        .returning()
      const [rome, other] = await database.orm
        .insert(database.schema.mints)
        .values([
          {
            slug: "rome-italy",
            name: "Rome Mint",
            place: "Rome",
            countryId: italy.id,
          },
          {
            slug: "other-italy",
            name: "Other Mint",
            place: "Milan",
            countryId: italy.id,
          },
        ])
        .returning()
      await database.orm.insert(database.schema.coinMints).values([
        { coinId: firstCoin.id, mintId: rome.id },
        { coinId: firstCoin.id, mintId: other.id },
        { coinId: secondCoin.id, mintId: rome.id },
      ])
      const detail = await database.findCoinById(firstCoin.id)
      expect(
        detail?.mints.map(({ slug, country }) => [slug, country.code])
      ).toEqual([
        ["other-italy", "IT"],
        ["rome-italy", "IT"],
      ])
      expect((await database.findCoinById(secondCoin.id))?.mints).toHaveLength(
        1
      )
      expect((await database.findCoinById(unassignedCoin.id))?.mints).toEqual(
        []
      )
      expect((await database.listCoins()).coins[0]).not.toHaveProperty("mints")
      expect((await database.listMints()).map(({ slug }) => slug)).toEqual([
        "other-italy",
        "rome-italy",
      ])
      expect(
        (await database.listCoins({ mintSlug: "rome-italy" })).coins
          .map(({ id }) => id)
          .sort()
      ).toEqual([firstCoin.id, secondCoin.id].sort())
      expect(
        (
          await database.listCoins({
            mintSlug: "rome-italy",
            issuerCode: "VA",
            pageSize: 1,
          })
        ).coins.map(({ id }) => id)
      ).toEqual([firstCoin.id])
      expect(await database.listCoins({ mintSlug: "unknown-mint" })).toEqual({
        coins: [],
        totalItems: 0,
      })
      expect(
        (await database.listCoins({ mintSlug: "other-italy" })).coins.map(
          ({ id }) => id
        )
      ).toEqual([firstCoin.id])
    } finally {
      await database.close()
    }
  })

  it("preserves Mint identities and rejects duplicate associations", async () => {
    const database = createDatabase(databaseUrl)
    try {
      const [issuer] = await database.orm
        .insert(database.schema.issuers)
        .values({ name: "Italy", code: "IT" })
        .returning()
      const [coin] = await database.orm
        .insert(database.schema.coins)
        .values({
          title: "Coin",
          issuerId: issuer.id,
          distributionId: sql`(select id from distributions where slug = 'circulating-commemorative')`,
          firstIssueYear: -1,
          lastIssueYear: 1,
        })
        .returning()
      const [mint] = await database.orm
        .insert(database.schema.mints)
        .values({
          slug: "valid-mint",
          name: "Mint",
          place: "Rome",
          countryId: issuer.id,
        })
        .returning()
      await expect(
        database.orm.insert(database.schema.mints).values({
          slug: "valid-mint",
          name: "Other Mint",
          place: "Milan",
          countryId: issuer.id,
        })
      ).rejects.toThrow()
      await expect(
        database.orm.insert(database.schema.mints).values({
          slug: "unknown-country-mint",
          name: "Other Mint",
          place: "Milan",
          countryId: "40000000-0000-4000-8000-000000000099",
        })
      ).rejects.toThrow()
      await database.orm
        .insert(database.schema.coinMints)
        .values({ coinId: coin.id, mintId: mint.id })
      await database.orm
        .update(database.schema.coins)
        .set({ lastIssueYear: 3 })
        .where(eq(database.schema.coins.id, coin.id))
      await expect(
        database.orm
          .insert(database.schema.coinMints)
          .values({ coinId: coin.id, mintId: mint.id })
      ).rejects.toThrow()
      await expect(
        database.orm
          .update(database.schema.mints)
          .set({ slug: "renamed-mint" })
          .where(eq(database.schema.mints.id, mint.id))
      ).rejects.toThrow()
      const [otherIssuer] = await database.orm
        .insert(database.schema.issuers)
        .values({ name: "Greece", code: "GR" })
        .returning()
      await expect(
        database.orm
          .update(database.schema.mints)
          .set({ countryId: otherIssuer.id })
          .where(eq(database.schema.mints.id, mint.id))
      ).rejects.toThrow()
      await database.orm
        .update(database.schema.mints)
        .set({ name: "Renamed Mint" })
        .where(eq(database.schema.mints.id, mint.id))
      const [renamed] = await database.orm
        .select()
        .from(database.schema.mints)
        .where(eq(database.schema.mints.id, mint.id))
      expect(renamed.updatedAt.getTime()).toBeGreaterThan(
        mint.updatedAt.getTime()
      )
    } finally {
      await database.close()
    }
  })

  it("seeds only source verified associations", async () => {
    const database = createDatabase(databaseUrl)
    try {
      await seedCoins(database, await readCoinSeed())
      expect(
        (await database.findCoinById("00000000-0000-4000-8000-000000000001"))
          ?.mints[0]?.slug
      ).toBe("rome-state-mint-italy")
      expect(
        (await database.findCoinById("00000000-0000-4000-8000-000000000009"))
          ?.mints[0]?.slug
      ).toBe("rome-state-mint-italy")
      expect(
        (await database.findCoinById("00000000-0000-4000-8000-000000000002"))
          ?.mints
      ).toEqual([])
      expect(
        (await database.findCoinById("00000000-0000-4000-8000-000000000004"))
          ?.mints
      ).toEqual([])
    } finally {
      await database.close()
    }
  })
})
