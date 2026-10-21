import { sql } from "drizzle-orm"
import { drizzle } from "drizzle-orm/node-postgres"
import { migrate } from "drizzle-orm/node-postgres/migrator"
import { Pool } from "pg"
import { beforeEach, describe, expect, it } from "vitest"

import { createDatabase, distributionInsertSchema, seedCoins } from "./index.js"

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
  it("uses a new Distribution for Coin list and detail and restricts deletion while used", async () => {
    const database = createDatabase(getDatabaseUrl())
    try {
      await database.orm.insert(database.schema.distributions).values({
        slug: "pattern-issue",
        name: "Pattern issue",
      })
      const [issuer] = await database.orm
        .insert(database.schema.issuers)
        .values({ code: "AR", name: "Argentina" })
        .returning()
      const [coin] = await database.orm
        .insert(database.schema.coins)
        .values({
          title: "Pattern Coin",
          issuerId: issuer.id,
          distribution: "pattern-issue",
          firstIssueYear: 2004,
          lastIssueYear: 2004,
        })
        .returning()

      await expect(
        database.listCoins({ distribution: "pattern-issue" })
      ).resolves.toMatchObject({
        coins: [
          expect.objectContaining({
            id: coin.id,
            distribution: "pattern-issue",
          }),
        ],
        totalItems: 1,
      })
      await expect(database.findCoinById(coin.id)).resolves.toMatchObject({
        distribution: "pattern-issue",
        distributionName: "Pattern issue",
      })
      await expect(
        database.orm
          .delete(database.schema.distributions)
          .where(sql`${database.schema.distributions.slug} = 'pattern-issue'`)
      ).rejects.toThrow()
      await expect(
        database.listCoins({ distribution: "unknown-pattern" })
      ).resolves.toMatchObject({
        coins: [],
        totalItems: 0,
      })
      await database.orm.insert(database.schema.distributions).values({
        slug: "unused-pattern",
        name: "Unused pattern",
      })
      await expect(
        database.orm
          .delete(database.schema.distributions)
          .where(sql`${database.schema.distributions.slug} = 'unused-pattern'`)
      ).resolves.toBeDefined()
    } finally {
      await database.close()
    }
  })

  it("seeds a Coin with a newly curated Distribution Slug", async () => {
    const database = createDatabase(getDatabaseUrl())
    try {
      await database.orm.insert(database.schema.distributions).values({
        slug: "pattern-issue",
        name: "Pattern issue",
      })
      const coinId = "00000000-0000-4000-8000-000000000077"
      await seedCoins(database, {
        issuers: [{ code: "AR", name: "Argentina" }],
        engravers: [],
        coins: [
          {
            id: coinId,
            title: "Seeded pattern Coin",
            issuerCode: "AR",
            distribution: "pattern-issue",
            firstIssueYear: 2004,
            lastIssueYear: 2004,
          },
        ],
      })
      await expect(database.findCoinById(coinId)).resolves.toMatchObject({
        distribution: "pattern-issue",
        distributionName: "Pattern issue",
      })
    } finally {
      await database.close()
    }
  })

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
