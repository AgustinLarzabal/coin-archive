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
            startYear: 2000,
            endYear: null,
            operating: true,
          },
          {
            slug: "other-italy",
            name: "Other Mint",
            place: "Milan",
            countryId: italy.id,
            startYear: null,
            endYear: 2004,
            operating: false,
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
    } finally {
      await database.close()
    }
  })

  it("rejects impossible periods and associations, including later edits", async () => {
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
      for (const period of [
        { startYear: 0 },
        { endYear: 0 },
        { startYear: 2, endYear: 1 },
        { endYear: 1, operating: true },
        { endYear: 1, operating: null },
      ]) {
        await expect(
          database.orm.insert(database.schema.mints).values({
            slug: "invalid-mint",
            name: "Mint",
            place: "Rome",
            countryId: issuer.id,
            ...period,
          })
        ).rejects.toThrow()
      }
      const [mint] = await database.orm
        .insert(database.schema.mints)
        .values({
          slug: "valid-mint",
          name: "Mint",
          place: "Rome",
          countryId: issuer.id,
          startYear: 1,
          endYear: null,
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
      await expect(
        database.orm
          .update(database.schema.mints)
          .set({ startYear: 2 })
          .where(eq(database.schema.mints.id, mint.id))
      ).rejects.toThrow()
      await expect(
        database.orm
          .update(database.schema.coins)
          .set({ lastIssueYear: -1 })
          .where(eq(database.schema.coins.id, coin.id))
      ).rejects.toThrow()
      const [later] = await database.orm
        .insert(database.schema.mints)
        .values({
          slug: "later-mint",
          name: "Later Mint",
          place: "Rome",
          countryId: issuer.id,
          startYear: 2,
        })
        .returning()
      await expect(
        database.orm
          .insert(database.schema.coinMints)
          .values({ coinId: coin.id, mintId: later.id })
      ).rejects.toThrow()
    } finally {
      await database.close()
    }
  })

  it("serializes a Mint period edit with a concurrent Coin association", async () => {
    const database = createDatabase(databaseUrl)
    const pool = new Pool({ connectionString: databaseUrl })
    const linkClient = await pool.connect()
    const editClient = await pool.connect()
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
          firstIssueYear: 2000,
          lastIssueYear: 2000,
        })
        .returning()
      const [mint] = await database.orm
        .insert(database.schema.mints)
        .values({
          slug: "concurrent-mint",
          name: "Mint",
          place: "Rome",
          countryId: issuer.id,
          startYear: 2000,
          operating: null,
        })
        .returning()
      await linkClient.query("begin")
      await linkClient.query(
        "insert into coin_mints (coin_id, mint_id) values ($1, $2)",
        [coin.id, mint.id]
      )
      await editClient.query("begin")
      const [{ pid }] = (
        await editClient.query<{ pid: number }>(
          "select pg_backend_pid() as pid"
        )
      ).rows
      const edit = expect(
        editClient.query("update mints set start_year = 2001 where id = $1", [
          mint.id,
        ])
      ).rejects.toThrow(/do not overlap/)
      let blocked = false
      for (let attempt = 0; attempt < 20; attempt++) {
        const { rows } = await pool.query<{ wait_event_type: string | null }>(
          "select wait_event_type from pg_stat_activity where pid = $1",
          [pid]
        )
        if (rows[0]?.wait_event_type === "Lock") {
          blocked = true
          break
        }
        await new Promise((resolve) => setTimeout(resolve, 10))
      }
      expect(blocked).toBe(true)
      await linkClient.query("commit")
      await edit
      await editClient.query("rollback")
      expect((await database.findCoinById(coin.id))?.mints[0]?.slug).toBe(
        "concurrent-mint"
      )
    } finally {
      await linkClient.query("rollback").catch(() => {})
      await editClient.query("rollback").catch(() => {})
      linkClient.release()
      editClient.release()
      await pool.end()
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
