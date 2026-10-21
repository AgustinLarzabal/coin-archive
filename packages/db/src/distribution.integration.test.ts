import { sql } from "drizzle-orm"
import { drizzle } from "drizzle-orm/node-postgres"
import { migrate } from "drizzle-orm/node-postgres/migrator"
import { Pool } from "pg"
import { beforeEach, describe, expect, it } from "vitest"

import { createDatabase, distributionInsertSchema } from "./index.js"

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL
  expect(databaseUrl).toBeTruthy()
  return databaseUrl ?? ""
}

beforeEach(async () => {
  const pool = new Pool({ connectionString: getDatabaseUrl() })
  try {
    await pool.query(
      "drop schema if exists drizzle cascade; drop schema public cascade; create schema public"
    )
    await migrate(drizzle(pool), { migrationsFolder: "drizzle" })
  } finally {
    await pool.end()
  }
})

describe("Coin Distribution catalogue", () => {
  it("seeds the three existing values and lists unused records by name then slug", async () => {
    const database = createDatabase(getDatabaseUrl())
    try {
      await expect(database.listDistributions()).resolves.toEqual([
        expect.objectContaining({
          slug: "circulating-commemorative",
          name: "Circulating commemorative",
        }),
        expect.objectContaining({
          slug: "non-circulating",
          name: "Non-circulating",
        }),
        expect.objectContaining({
          slug: "standard-circulation",
          name: "Standard circulation",
        }),
      ])
      await database.orm
        .insert(database.schema.distributions)
        .values({ slug: "unused-pattern", name: "Pattern" })
      await expect(database.listDistributions()).resolves.toEqual([
        expect.objectContaining({ slug: "circulating-commemorative" }),
        expect.objectContaining({ slug: "non-circulating" }),
        expect.objectContaining({ slug: "unused-pattern", name: "Pattern" }),
        expect.objectContaining({ slug: "standard-circulation" }),
      ])
    } finally {
      await database.close()
    }
  })

  it("validates slugs and names, and enforces uniqueness regardless of name case", async () => {
    const database = createDatabase(getDatabaseUrl())
    try {
      for (const value of [
        { slug: "Bad-Slug", name: "Valid" },
        { slug: "ok", name: "Valid" },
        { slug: "valid-slug", name: " Valid" },
        { slug: "valid-slug", name: "" },
      ]) {
        expect(distributionInsertSchema.safeParse(value).success).toBe(false)
      }
      await expect(
        database.orm.execute(
          sql`insert into distributions (slug, name) values ('Bad-Slug', 'Valid')`
        )
      ).rejects.toThrow()
      await expect(
        database.orm.execute(
          sql`insert into distributions (slug, name) values ('valid-slug', ' Valid')`
        )
      ).rejects.toThrow()
      await expect(
        database.orm.execute(
          sql`insert into distributions (slug, name) values ('other-slug', 'STANDARD CIRCULATION')`
        )
      ).rejects.toThrow()
      await expect(
        database.orm.execute(
          sql`insert into distributions (slug, name) values ('standard-circulation', 'New name')`
        )
      ).rejects.toThrow()
    } finally {
      await database.close()
    }
  })

  it("keeps existing Coin assignment, filtering, and detail responses when a catalogue name changes", async () => {
    const database = createDatabase(getDatabaseUrl())
    try {
      const [issuer] = await database.orm
        .insert(database.schema.issuers)
        .values({ code: "AR", name: "Argentina" })
        .returning()
      const [coin] = await database.orm
        .insert(database.schema.coins)
        .values({
          title: "Test coin",
          issuerId: issuer.id,
          distribution: "non-circulating",
          firstIssueYear: 2004,
          lastIssueYear: 2004,
        })
        .returning()
      await database.orm
        .update(database.schema.distributions)
        .set({ name: "Collector issue" })
        .where(sql`${database.schema.distributions.slug} = 'non-circulating'`)
      await expect(database.listDistributions()).resolves.toContainEqual(
        expect.objectContaining({
          slug: "non-circulating",
          name: "Collector issue",
        })
      )
      await expect(
        database.listCoins({ distribution: "non-circulating" })
      ).resolves.toEqual(
        expect.objectContaining({
          coins: [expect.objectContaining({ distribution: "non-circulating" })],
          totalItems: 1,
        })
      )
      await expect(database.findCoinById(coin.id)).resolves.toEqual(
        expect.objectContaining({
          distribution: "non-circulating",
          distributionName: "Collector issue",
        })
      )
    } finally {
      await database.close()
    }
  })
})
