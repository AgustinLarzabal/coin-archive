import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { sql } from "drizzle-orm"
import { drizzle } from "drizzle-orm/node-postgres"
import { migrate } from "drizzle-orm/node-postgres/migrator"
import { Pool } from "pg"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { createDatabase, seedCoins } from "./index.js"

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

describe("Face Value persistence", () => {
  it("lists every Currency by derived Full Name, including unused Currencies", async () => {
    const database = createDatabase(getDatabaseUrl())
    try {
      await database.orm.insert(database.schema.currencies).values([
        { slug: "z-unit", name: "Zed", periodLabel: "old" },
        { slug: "a-unit", name: "Alpha", periodLabel: "new" },
      ])

      await expect(database.listCurrencies()).resolves.toMatchObject([
        { slug: "a-unit", name: "Alpha", periodLabel: "new" },
        { slug: "z-unit", name: "Zed", periodLabel: "old" },
      ])
    } finally {
      await database.close()
    }
  })

  it("composes Currency and Amount with every filter, ordering, totals, and pagination", async () => {
    const database = createDatabase(getDatabaseUrl())
    try {
      const [peso, euro] = await database.orm
        .insert(database.schema.currencies)
        .values([
          { slug: "argentine-peso", name: "Peso", periodLabel: "present" },
          { slug: "euro", name: "Euro", periodLabel: "present" },
        ])
        .returning()
      const [pesoDenomination, euroDenomination] = await database.orm
        .insert(database.schema.denominations)
        .values([
          { currencyId: peso.id, label: "1 peso", amount: "1" },
          { currencyId: euro.id, label: "1 euro", amount: "1" },
        ])
        .returning()
      const [argentina, italy] = await database.orm
        .insert(database.schema.issuers)
        .values([
          { code: "AR", name: "Argentina" },
          { code: "IT", name: "Italy" },
        ])
        .returning()
      const [engraver] = await database.orm
        .insert(database.schema.engravers)
        .values({ slug: "selected-engraver", fullName: "Selected Engraver" })
        .returning()
      const [ruler] = await database.orm
        .insert(database.schema.rulingAuthorities)
        .values({ slug: "selected-ruler", name: "Selected Ruler" })
        .returning()
      const firstMatchingId = "00000000-0000-4000-8000-000000000001"
      const secondMatchingId = "00000000-0000-4000-8000-000000000002"
      await database.orm.insert(database.schema.coins).values([
        {
          id: firstMatchingId,
          title: "First matching peso",
          issuerId: argentina.id,
          denominationId: pesoDenomination.id,
          distributionId: sql`(select id from distributions where slug = ${"standard-circulation"})`,
          firstIssueYear: 2000,
          lastIssueYear: 2000,
          createdAt: new Date("2026-09-16T10:00:00.000Z"),
        },
        {
          id: secondMatchingId,
          title: "Second matching peso",
          issuerId: argentina.id,
          denominationId: pesoDenomination.id,
          distributionId: sql`(select id from distributions where slug = ${"standard-circulation"})`,
          firstIssueYear: 1999,
          lastIssueYear: 2001,
          createdAt: new Date("2026-09-16T10:00:00.000Z"),
        },
        {
          title: "Wrong issuer peso",
          issuerId: italy.id,
          denominationId: pesoDenomination.id,
          distributionId: sql`(select id from distributions where slug = ${"standard-circulation"})`,
          firstIssueYear: 2000,
          lastIssueYear: 2000,
        },
        {
          title: "Euro",
          issuerId: argentina.id,
          denominationId: euroDenomination.id,
          distributionId: sql`(select id from distributions where slug = ${"standard-circulation"})`,
          firstIssueYear: 2000,
          lastIssueYear: 2000,
        },
      ])
      const surfaces = await database.orm
        .insert(database.schema.coinSurfaces)
        .values([
          {
            coinId: firstMatchingId,
            kind: "obverse",
            description: "Portrait",
          },
          {
            coinId: secondMatchingId,
            kind: "obverse",
            description: "Portrait",
          },
        ])
        .returning()
      await database.orm.insert(database.schema.coinSurfaceEngravers).values(
        surfaces.map((surface) => ({
          coinSurfaceId: surface.id,
          engraverId: engraver.id,
          position: 1,
        }))
      )
      await database.orm
        .insert(database.schema.coinRulingAuthorityAttributions)
        .values(
          [firstMatchingId, secondMatchingId].map((coinId) => ({
            coinId,
            rulingAuthorityId: ruler.id,
            role: "President",
            position: 1,
          }))
        )

      const page = await database.listCoins({
        currencySlug: "argentine-peso",
        distribution: "standard-circulation",
        engraverSlug: "selected-engraver",
        faceValueAmount: "1",
        issueYearInterval: { firstIssueYear: 2000, lastIssueYear: 2000 },
        issuerCode: "AR",
        page: 1,
        pageSize: 1,
        rulingAuthoritySlug: "selected-ruler",
      })
      expect(page.totalItems).toBe(2)
      expect(page.coins.map((coin) => coin.id)).toEqual([firstMatchingId])
      await expect(
        database.listCoins({ currencySlug: "unknown-currency" })
      ).resolves.toEqual({ coins: [], totalItems: 0 })
    } finally {
      await database.close()
    }
  })

  it("filters every Denomination at one exact Amount within the selected Currency", async () => {
    const database = createDatabase(getDatabaseUrl())
    try {
      const [peso, euro] = await database.orm
        .insert(database.schema.currencies)
        .values([
          { slug: "argentine-peso", name: "Peso", periodLabel: "present" },
          { slug: "euro", name: "Euro", periodLabel: "present" },
        ])
        .returning()
      const [onePeso, pesoAlternative, twoPesos, oneEuro] = await database.orm
        .insert(database.schema.denominations)
        .values([
          { currencyId: peso.id, label: "1 peso", amount: "1" },
          {
            currencyId: peso.id,
            label: "100 centavos",
            amount: "1.000000000000",
          },
          { currencyId: peso.id, label: "2 pesos", amount: "2" },
          { currencyId: euro.id, label: "1 euro", amount: "1" },
        ])
        .returning()
      const [issuer] = await database.orm
        .insert(database.schema.issuers)
        .values({ code: "AR", name: "Argentina" })
        .returning()
      await database.orm.insert(database.schema.coins).values([
        {
          id: "00000000-0000-4000-8000-000000000001",
          title: "One peso",
          issuerId: issuer.id,
          denominationId: onePeso.id,
          distributionId: sql`(select id from distributions where slug = ${"standard-circulation"})`,
          firstIssueYear: 2000,
          lastIssueYear: 2000,
        },
        {
          id: "00000000-0000-4000-8000-000000000002",
          title: "Alternative peso label",
          issuerId: issuer.id,
          denominationId: pesoAlternative.id,
          distributionId: sql`(select id from distributions where slug = ${"standard-circulation"})`,
          firstIssueYear: 2000,
          lastIssueYear: 2000,
        },
        {
          title: "Two pesos",
          issuerId: issuer.id,
          denominationId: twoPesos.id,
          distributionId: sql`(select id from distributions where slug = ${"standard-circulation"})`,
          firstIssueYear: 2000,
          lastIssueYear: 2000,
        },
        {
          title: "One euro",
          issuerId: issuer.id,
          denominationId: oneEuro.id,
          distributionId: sql`(select id from distributions where slug = ${"standard-circulation"})`,
          firstIssueYear: 2000,
          lastIssueYear: 2000,
        },
      ])

      const page = await database.listCoins({
        currencySlug: "argentine-peso",
        faceValueAmount: "1",
      })

      expect(page.totalItems).toBe(2)
      expect(page.coins.map((coin) => coin.title)).toEqual([
        "One peso",
        "Alternative peso label",
      ])
    } finally {
      await database.close()
    }
  })

  it("returns populated and absent Face Values from the paginated Coin list", async () => {
    const database = createDatabase(getDatabaseUrl())
    try {
      const [currency] = await database.orm
        .insert(database.schema.currencies)
        .values({
          slug: "argentine-peso-convertible",
          name: "Peso",
          periodLabel: "1992–2001",
        })
        .returning()
      const [denomination] = await database.orm
        .insert(database.schema.denominations)
        .values({ currencyId: currency.id, label: "1 peso", amount: "1" })
        .returning()
      const [issuer] = await database.orm
        .insert(database.schema.issuers)
        .values({ code: "AR", name: "Argentina" })
        .returning()
      const [withoutFaceValue, withFaceValue] = await database.orm
        .insert(database.schema.coins)
        .values([
          {
            id: "00000000-0000-4000-8000-000000000002",
            title: "Uncurated Coin",
            issuerId: issuer.id,
            distributionId: sql`(select id from distributions where slug = ${"standard-circulation"})`,
            firstIssueYear: 2000,
            lastIssueYear: 2000,
            createdAt: new Date("2026-09-16T10:00:00.000Z"),
          },
          {
            id: "00000000-0000-4000-8000-000000000001",
            title: "1 peso",
            issuerId: issuer.id,
            denominationId: denomination.id,
            distributionId: sql`(select id from distributions where slug = ${"standard-circulation"})`,
            firstIssueYear: 1994,
            lastIssueYear: 1994,
            createdAt: new Date("2026-09-16T10:00:00.000Z"),
          },
        ])
        .returning()

      await expect(database.listCoins()).resolves.toEqual({
        coins: [
          expect.objectContaining({
            id: withFaceValue.id,
            denomination: {
              ...denomination,
              currency,
            },
          }),
          expect.objectContaining({
            id: withoutFaceValue.id,
            denomination: null,
          }),
        ],
        totalItems: 2,
      })
    } finally {
      await database.close()
    }
  })

  it("reuses a constrained Denomination and returns it from Coin detail", async () => {
    const database = createDatabase(getDatabaseUrl())
    try {
      const [currency] = await database.orm
        .insert(database.schema.currencies)
        .values({
          slug: "argentine-peso-convertible",
          name: "Peso",
          periodLabel: "1992–2001",
        })
        .returning()
      const [denomination] = await database.orm
        .insert(database.schema.denominations)
        .values({ currencyId: currency.id, label: "1 peso", amount: "1" })
        .returning()
      const [issuer] = await database.orm
        .insert(database.schema.issuers)
        .values({ code: "AR", name: "Argentina" })
        .returning()
      const [coin] = await database.orm
        .insert(database.schema.coins)
        .values({
          title: "1 peso",
          issuerId: issuer.id,
          denominationId: denomination.id,
          distributionId: sql`(select id from distributions where slug = ${"standard-circulation"})`,
          firstIssueYear: 1994,
          lastIssueYear: 1994,
        })
        .returning()

      await expect(database.findCoinById(coin.id)).resolves.toMatchObject({
        denomination: {
          label: "1 peso",
          amount: "1",
          currency: {
            slug: "argentine-peso-convertible",
            name: "Peso",
            periodLabel: "1992–2001",
          },
        },
      })
      await expect(
        database.orm.delete(database.schema.currencies)
      ).rejects.toThrow()
      await expect(
        database.orm.delete(database.schema.denominations)
      ).rejects.toThrow()
    } finally {
      await database.close()
    }
  })

  it("preserves a Coin without a fabricated Face Value", async () => {
    const database = createDatabase(getDatabaseUrl())
    try {
      const [issuer] = await database.orm
        .insert(database.schema.issuers)
        .values({ code: "AR", name: "Argentina" })
        .returning()
      const [coin] = await database.orm
        .insert(database.schema.coins)
        .values({
          title: "Uncurated Coin",
          issuerId: issuer.id,
          distributionId: sql`(select id from distributions where slug = ${"standard-circulation"})`,
          firstIssueYear: 2000,
          lastIssueYear: 2000,
        })
        .returning()

      await expect(database.findCoinById(coin.id)).resolves.toMatchObject({
        denomination: null,
      })
    } finally {
      await database.close()
    }
  })

  it("upgrades an existing Coin without fabricating a Face Value", async () => {
    const olderMigrations = await mkdtemp(join(tmpdir(), "coin-archive-migrations-"))
    const pool = new Pool({ connectionString: getDatabaseUrl() })
    try {
      await cp(new URL("../drizzle/", import.meta.url), olderMigrations, {
        recursive: true,
      })
      const journalPath = join(olderMigrations, "meta", "_journal.json")
      const journal = JSON.parse(await readFile(journalPath, "utf8")) as {
        entries: Array<{ tag: string }>
      }
      const latestMigration = journal.entries.pop()
      if (!latestMigration) throw new Error("Expected a latest migration")
      await writeFile(journalPath, JSON.stringify(journal))
      await rm(join(olderMigrations, `${latestMigration.tag}.sql`))

      await pool.query(
        "drop schema if exists drizzle cascade; drop schema public cascade; create schema public"
      )
      await migrate(drizzle(pool), { migrationsFolder: olderMigrations })
      const issuer = await pool.query<{ id: string }>(`
        insert into issuers (name, code) values ('Argentina', 'AR') returning id
      `)
      const coinId = "00000000-0000-4000-8000-000000000070"
      await pool.query(
        `insert into coins (
          id, title, issuer_id, distribution, first_issue_year, last_issue_year
        ) values ($1, 'Existing Coin', $2, 'standard-circulation', 2000, 2000)`,
        [coinId, issuer.rows[0].id]
      )

      await migrate(drizzle(pool), { migrationsFolder: "drizzle" })

      const upgraded = await pool.query<{ denomination_id: string | null }>(
        "select denomination_id from coins where id = $1",
        [coinId]
      )
      expect(upgraded.rows).toEqual([{ denomination_id: null }])
    } finally {
      await pool.end()
      await rm(olderMigrations, { recursive: true })
    }
  })

  it("enforces Currency and Denomination catalogue invariants", async () => {
    const database = createDatabase(getDatabaseUrl())
    try {
      const [currency] = await database.orm
        .insert(database.schema.currencies)
        .values({
          slug: "euro",
          name: "Euro",
          periodLabel: "1999–present",
        })
        .returning()

      await expect(
        database.orm
          .update(database.schema.currencies)
          .set({ slug: "renamed-euro" })
          .where(sql`${database.schema.currencies.id} = ${currency.id}`)
      ).rejects.toThrow()
      await database.orm.insert(database.schema.denominations).values({
        currencyId: currency.id,
        label: "1 euro",
        amount: "1",
      })
      await expect(
        database.orm.insert(database.schema.denominations).values({
          currencyId: currency.id,
          label: "1 EURO",
          amount: "2",
        })
      ).rejects.toThrow()
      await database.orm.insert(database.schema.denominations).values({
        currencyId: currency.id,
        label: "100 cents",
        amount: "1",
      })
      await database.orm.insert(database.schema.denominations).values({
        currencyId: currency.id,
        label: "maximum precision",
        amount: "999999999999999999.123456789012",
      })
      await expect(
        database.orm.insert(database.schema.denominations).values({
          currencyId: currency.id,
          label: "too many integer digits",
          amount: "1000000000000000000",
        })
      ).rejects.toThrow()
      await expect(
        database.orm.insert(database.schema.denominations).values({
          currencyId: currency.id,
          label: "too many fractional digits",
          amount: "1.1234567890129",
        })
      ).rejects.toThrow()
      await expect(
        database.orm.insert(database.schema.denominations).values({
          currencyId: currency.id,
          label: "zero euro",
          amount: "0",
        })
      ).rejects.toThrow()
      await expect(
        database.orm.insert(database.schema.denominations).values({
          currencyId: currency.id,
          label: " padded",
          amount: "1",
        })
      ).rejects.toThrow()
    } finally {
      await database.close()
    }
  })
})

describe("Face Value seed", () => {
  const validSeed = {
    issuers: [{ code: "AR", name: "Argentina" }],
    currencies: [
      {
        slug: "argentine-peso-convertible",
        name: "Peso",
        periodLabel: "1992–2001",
      },
    ],
    denominations: [
      {
        currencySlug: "argentine-peso-convertible",
        label: "1 peso",
        amount: "1",
      },
    ],
    engravers: [],
    coins: [
      {
        id: "00000000-0000-4000-8000-000000000071",
        title: "Verified Face Value Coin",
        issuerCode: "AR",
        denomination: {
          currencySlug: "argentine-peso-convertible",
          label: "1 peso",
        },
        distribution: "standard-circulation" as const,
        firstIssueYear: 1994,
        lastIssueYear: 1994,
      },
    ],
  }

  it("defines reusable Denominations once and resolves a Coin reference", async () => {
    const database = createDatabase(getDatabaseUrl())
    try {
      await seedCoins(database, validSeed)

      await expect(
        database.findCoinById(validSeed.coins[0].id)
      ).resolves.toMatchObject({
        denomination: {
          label: "1 peso",
          amount: "1",
          currency: { slug: "argentine-peso-convertible" },
        },
      })
    } finally {
      await database.close()
    }
  })

  it.each([
    [
      "a case-insensitive duplicate Denomination label",
      {
        ...validSeed,
        denominations: [
          ...validSeed.denominations,
          {
            currencySlug: "argentine-peso-convertible",
            label: "1 PESO",
            amount: "2",
          },
        ],
      },
    ],
    [
      "a Unicode case-insensitive duplicate Denomination label",
      {
        ...validSeed,
        denominations: [
          {
            currencySlug: "argentine-peso-convertible",
            label: "İ peso",
            amount: "1",
          },
          {
            currencySlug: "argentine-peso-convertible",
            label: "i peso",
            amount: "2",
          },
        ],
        coins: [],
      },
    ],
    [
      "an unknown Denomination reference",
      {
        ...validSeed,
        coins: [
          {
            ...validSeed.coins[0],
            denomination: {
              currencySlug: "argentine-peso-convertible",
              label: "2 pesos",
            },
          },
        ],
      },
    ],
    [
      "an invalid amount",
      {
        ...validSeed,
        denominations: [{ ...validSeed.denominations[0], amount: "0" }],
      },
    ],
  ])("rejects %s before writing", async (_case, seed) => {
    const database = createDatabase(getDatabaseUrl())
    try {
      const transaction = vi.spyOn(database.orm, "transaction")

      await expect(seedCoins(database, seed)).rejects.toThrow()

      expect(transaction).not.toHaveBeenCalled()
    } finally {
      await database.close()
    }
  })

  it("rolls back new catalogue records when a later Coin insert fails", async () => {
    const database = createDatabase(getDatabaseUrl())
    try {
      const [existingIssuer] = await database.orm
        .insert(database.schema.issuers)
        .values({ code: "XX", name: "Existing Issuer" })
        .returning()
      await database.orm.insert(database.schema.coins).values({
        id: validSeed.coins[0].id,
        title: "Existing Coin",
        issuerId: existingIssuer.id,
        distributionId: sql`(select id from distributions where slug = ${"standard-circulation"})`,
        firstIssueYear: 2000,
        lastIssueYear: 2000,
      })

      await expect(seedCoins(database, validSeed)).rejects.toThrow()

      await expect(
        database.orm.select().from(database.schema.currencies)
      ).resolves.toEqual([])
      await expect(
        database.orm.select().from(database.schema.denominations)
      ).resolves.toEqual([])
    } finally {
      await database.close()
    }
  })
})
