import { sql } from "drizzle-orm"
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

describe("Coin Tags", () => {
  it("filters shared and multiple Tags before counting and pagination, and protects attributions", async () => {
    const database = createDatabase(databaseUrl)
    try {
      const [issuer] = await database.orm
        .insert(database.schema.issuers)
        .values({
          slug: `test-issuer-${crypto.randomUUID()}`,
          name: "Finland",
          code: "FI",
        })
        .returning()
      const [first, second, untagged] = await database.orm
        .insert(database.schema.coins)
        .values(
          ["First", "Second", "Untagged"].map((title) => ({
            slug: `test-coin-${crypto.randomUUID()}`,
            title,
            issuerId: issuer.id,
            distributionId: sql`(select id from distributions where slug = 'circulating-commemorative')`,
            firstIssueYear: 2004,
            lastIssueYear: 2004,
          }))
        )
        .returning()
      const [map, flag] = await database.orm
        .insert(database.schema.tags)
        .values([
          { slug: "map", name: "Map" },
          { slug: "flag", name: "Flag" },
        ])
        .returning()
      await expect(
        database.orm
          .insert(database.schema.tags)
          .values({ slug: "another-map", name: "map" })
      ).rejects.toThrow()
      await database.orm.insert(database.schema.coinTags).values([
        { coinId: first.id, tagId: map.id },
        { coinId: first.id, tagId: flag.id },
        { coinId: second.id, tagId: map.id },
      ])
      expect((await database.listTags()).map(({ slug }) => slug)).toEqual([
        "flag",
        "map",
      ])
      expect(
        (
          await database.listCoins({
            tagSlugs: ["map"],
            issuerCode: "FI",
            pageSize: 1,
          })
        ).totalItems
      ).toBe(2)
      expect(
        (await database.listCoins({ tagSlugs: ["map"], page: 2, pageSize: 1 }))
          .coins
      ).toHaveLength(1)
      expect(
        (await database.listCoins({ tagSlugs: ["flag"] })).coins.map(
          ({ id }) => id
        )
      ).toEqual([first.id])
      expect(
        await database.listCoins({
          tagSlugs: ["map", "flag"],
          issuerCode: "FI",
          pageSize: 1,
        })
      ).toMatchObject({
        totalItems: 1,
        coins: [{ id: first.id }],
      })
      const anyTagPage = await database.listCoins({
        tagSlugs: ["map", "flag"],
        tagMatch: "any",
        pageSize: 1,
      })
      expect(anyTagPage.totalItems).toBe(2)
      expect(anyTagPage.coins).toHaveLength(1)
      expect(
        (
          await database.listCoins({
            tagSlugs: ["map", "flag"],
            tagMatch: "any",
          })
        ).coins.map(({ id }) => id)
      ).toEqual(expect.arrayContaining([first.id, second.id]))
      expect(
        await database.listCoins({
          tagSlugs: ["map", "unknown-map"],
          tagMatch: "any",
        })
      ).toMatchObject({ totalItems: 2 })
      expect(
        await database.listCoins({
          tagSlugs: ["map", "flag"],
          page: 2,
          pageSize: 1,
        })
      ).toEqual({
        coins: [],
        totalItems: 1,
      })
      expect(
        await database.listCoins({ tagSlugs: ["map", "unknown-map"] })
      ).toEqual({
        coins: [],
        totalItems: 0,
      })
      expect(await database.listCoins({ tagSlugs: ["unknown-map"] })).toEqual({
        coins: [],
        totalItems: 0,
      })
      expect((await database.listCoins()).coins.map(({ id }) => id)).toContain(
        untagged.id
      )
      expect((await database.findCoinById(first.id))?.tags).toEqual([
        { slug: "flag", name: "Flag" },
        { slug: "map", name: "Map" },
      ])
      expect((await database.findCoinById(untagged.id))?.tags).toEqual([])
      expect((await database.listCoins()).coins[0]).not.toHaveProperty("tags")
      await expect(
        database.orm
          .insert(database.schema.coinTags)
          .values({ coinId: first.id, tagId: map.id })
      ).rejects.toThrow()
      await expect(
        database.orm
          .delete(database.schema.tags)
          .where(sql`${database.schema.tags.id} = ${map.id}`)
      ).rejects.toThrow()
    } finally {
      await database.close()
    }
  })

  it("seeds overlapping motifs for manual all and any searches", async () => {
    const database = createDatabase(databaseUrl)
    try {
      await seedCoins(database, await readCoinSeed())
      expect(
        (await database.listTags()).map(({ slug, name }) => ({ slug, name }))
      ).toEqual([
        { slug: "flag", name: "Flag" },
        { slug: "globe", name: "Globe" },
        { slug: "map", name: "Map" },
      ])
      const page = await database.listCoins({ tagSlugs: ["map"] })
      expect(page.totalItems).toBe(3)
      expect(page.coins.map(({ title }) => title).sort()).toEqual([
        "50th Anniversary of the World Food Programme",
        "Enlargement of the European Union by Ten New Member States",
        "Olympic Games in Athens 2004",
      ])
      expect(
        await database.listCoins({ tagSlugs: ["map", "globe"] })
      ).toMatchObject({
        totalItems: 1,
        coins: [{ title: "50th Anniversary of the World Food Programme" }],
      })
      expect(
        await database.listCoins({
          tagSlugs: ["map", "globe"],
          tagMatch: "any",
        })
      ).toMatchObject({ totalItems: 4 })
      expect(
        await database.listCoins({ tagSlugs: ["map", "flag"] })
      ).toMatchObject({ totalItems: 0 })
      const all = await database.listCoins({ pageSize: 100 })
      expect(all.totalItems).toBeGreaterThan(2)
    } finally {
      await database.close()
    }
  })
})
