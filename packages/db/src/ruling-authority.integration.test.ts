import { sql } from "drizzle-orm"
import { drizzle } from "drizzle-orm/node-postgres"
import { migrate } from "drizzle-orm/node-postgres/migrator"
import { Pool } from "pg"
import { beforeEach, describe, expect, it } from "vitest"

import {
  createDatabase,
  rulingAuthorityRecordSchema,
  seedCoins,
} from "./index.js"

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

describe("Ruling Authority persistence", () => {
  it("requires stable unique Slugs while allowing duplicate names", async () => {
    const database = createDatabase(getDatabaseUrl())
    try {
      const [authority, sameName] = await database.orm
        .insert(database.schema.rulingAuthorities)
        .values([
          { slug: "first-authority", name: "Shared Name" },
          { slug: "second-authority", name: "Shared Name" },
        ])
        .returning()

      expect(rulingAuthorityRecordSchema.parse(authority)).toEqual(authority)
      expect(authority.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
      )
      expect(sameName.name).toBe(authority.name)
      await expect(
        database.orm.insert(database.schema.rulingAuthorities).values({
          slug: authority.slug,
          name: "Different Name",
        })
      ).rejects.toThrow()
      await expect(
        database.orm.execute(
          sql`insert into ruling_authorities (name) values ('Missing Slug')`
        )
      ).rejects.toThrow()
    } finally {
      await database.close()
    }
  })

  it("returns ordered contextual attributions and leaves uncurated Coins empty", async () => {
    const database = createDatabase(getDatabaseUrl())
    try {
      const [issuer] = await database.orm
        .insert(database.schema.issuers)
        .values({ name: "Test Issuer", code: "TI" })
        .returning()
      const [attributedCoin, uncuratedCoin] = await database.orm
        .insert(database.schema.coins)
        .values([
          {
            title: "Attributed Coin",
            issuerId: issuer.id,
            firstIssueYear: 2004,
            lastIssueYear: 2004,
          },
          {
            title: "Uncurated Coin",
            issuerId: issuer.id,
            firstIssueYear: 2005,
            lastIssueYear: 2005,
          },
        ])
        .returning()
      const [sharedAuthority, secondAuthority] = await database.orm
        .insert(database.schema.rulingAuthorities)
        .values([
          { slug: "shared-authority", name: "Shared Authority" },
          { slug: "second-authority", name: "Second Authority" },
        ])
        .returning()

      await database.orm
        .insert(database.schema.coinRulingAuthorityAttributions)
        .values([
          {
            coinId: attributedCoin.id,
            rulingAuthorityId: sharedAuthority.id,
            role: "Second Role",
            tenure: "2001–2004",
            position: 2,
          },
          {
            coinId: attributedCoin.id,
            rulingAuthorityId: secondAuthority.id,
            role: "First Role",
            tenure: null,
            position: 1,
          },
          {
            coinId: attributedCoin.id,
            rulingAuthorityId: sharedAuthority.id,
            role: "Third Role",
            tenure: "circa 2004",
            position: 3,
          },
        ])

      await expect(
        database.findCoinById(attributedCoin.id)
      ).resolves.toMatchObject({
        rulingAuthorityAttributions: [
          {
            slug: "second-authority",
            name: "Second Authority",
            role: "First Role",
            tenure: null,
          },
          {
            slug: "shared-authority",
            name: "Shared Authority",
            role: "Second Role",
            tenure: "2001–2004",
          },
          {
            slug: "shared-authority",
            name: "Shared Authority",
            role: "Third Role",
            tenure: "circa 2004",
          },
        ],
      })
      await expect(
        database.findCoinById(uncuratedCoin.id)
      ).resolves.toMatchObject({ rulingAuthorityAttributions: [] })
    } finally {
      await database.close()
    }
  })

  it("enforces attribution validation, unique positions, and referential integrity", async () => {
    const database = createDatabase(getDatabaseUrl())
    try {
      const [issuer] = await database.orm
        .insert(database.schema.issuers)
        .values({ name: "Test Issuer", code: "TI" })
        .returning()
      const [coin] = await database.orm
        .insert(database.schema.coins)
        .values({
          title: "Attributed Coin",
          issuerId: issuer.id,
          firstIssueYear: 2004,
          lastIssueYear: 2004,
        })
        .returning()
      const [authority] = await database.orm
        .insert(database.schema.rulingAuthorities)
        .values({ slug: "lasting-authority", name: "Lasting Authority" })
        .returning()

      await database.orm
        .insert(database.schema.coinRulingAuthorityAttributions)
        .values({
          coinId: coin.id,
          rulingAuthorityId: authority.id,
          role: "Role",
          tenure: null,
          position: 1,
        })

      for (const attribution of [
        { role: "", tenure: null, position: 2 },
        { role: " padded", tenure: null, position: 2 },
        { role: "Role", tenure: "", position: 2 },
        { role: "Role", tenure: "padded ", position: 2 },
        { role: "Role", tenure: null, position: 0 },
        { role: "Role", tenure: null, position: 1 },
      ]) {
        await expect(
          database.orm
            .insert(database.schema.coinRulingAuthorityAttributions)
            .values({
              coinId: coin.id,
              rulingAuthorityId: authority.id,
              ...attribution,
            })
        ).rejects.toThrow()
      }

      await expect(
        database.orm
          .delete(database.schema.rulingAuthorities)
          .where(sql`${database.schema.rulingAuthorities.id} = ${authority.id}`)
      ).rejects.toThrow()

      await database.orm
        .delete(database.schema.coins)
        .where(sql`${database.schema.coins.id} = ${coin.id}`)
      await expect(
        database.orm
          .delete(database.schema.rulingAuthorities)
          .where(sql`${database.schema.rulingAuthorities.id} = ${authority.id}`)
      ).resolves.toBeDefined()
    } finally {
      await database.close()
    }
  })

  it("seeds reusable authorities and ordered Coin attributions", async () => {
    const database = createDatabase(getDatabaseUrl())
    try {
      const coinId = "00000000-0000-4000-8000-000000000001"
      await seedCoins(database, {
        issuers: [{ name: "Test Issuer", code: "TI" }],
        engravers: [],
        authorities: [
          { slug: "first-authority", name: "First Authority" },
          { slug: "second-authority", name: "Second Authority" },
        ],
        coins: [
          {
            id: coinId,
            title: "Seeded Coin",
            issuerCode: "TI",
            firstIssueYear: 2004,
            lastIssueYear: 2004,
            rulingAuthorityAttributions: [
              {
                slug: "second-authority",
                role: "Second Role",
                tenure: "2000–2004",
                position: 2,
              },
              {
                slug: "first-authority",
                role: "First Role",
                position: 1,
              },
            ],
          },
        ],
      })

      await expect(database.findCoinById(coinId)).resolves.toMatchObject({
        rulingAuthorityAttributions: [
          {
            slug: "first-authority",
            name: "First Authority",
            role: "First Role",
            tenure: null,
          },
          {
            slug: "second-authority",
            name: "Second Authority",
            role: "Second Role",
            tenure: "2000–2004",
          },
        ],
      })
    } finally {
      await database.close()
    }
  })

  it.each([
    [
      "a malformed authority",
      {
        authorities: [{ slug: "Bad Slug", name: "Authority" }],
        coins: [],
      },
      "Invalid string",
    ],
    [
      "a malformed attribution",
      {
        authorities: [{ slug: "known-authority", name: "Authority" }],
        coins: [
          {
            id: "00000000-0000-4000-8000-000000000001",
            title: "Invalid attribution",
            issuerCode: "TI",
            firstIssueYear: 2004,
            lastIssueYear: 2004,
            rulingAuthorityAttributions: [
              {
                slug: "known-authority",
                role: " padded",
                tenure: "",
                position: 1,
              },
            ],
          },
        ],
      },
      "must be trimmed",
    ],
    [
      "duplicate attribution positions",
      {
        authorities: [
          { slug: "first-authority", name: "First Authority" },
          { slug: "second-authority", name: "Second Authority" },
        ],
        coins: [
          {
            id: "00000000-0000-4000-8000-000000000001",
            title: "Duplicate position",
            issuerCode: "TI",
            firstIssueYear: 2004,
            lastIssueYear: 2004,
            rulingAuthorityAttributions: [
              { slug: "first-authority", role: "Role", position: 1 },
              { slug: "second-authority", role: "Role", position: 1 },
            ],
          },
        ],
      },
      "Duplicate Ruling Authority position: 1",
    ],
    [
      "an unknown authority reference",
      {
        authorities: [],
        coins: [
          {
            id: "00000000-0000-4000-8000-000000000001",
            title: "Unknown authority",
            issuerCode: "TI",
            firstIssueYear: 2004,
            lastIssueYear: 2004,
            rulingAuthorityAttributions: [
              { slug: "missing-authority", role: "Role", position: 1 },
            ],
          },
        ],
      },
      "Coin references unknown Ruling Authority Slug: missing-authority",
    ],
  ])(
    "rejects catalogue seed data containing %s",
    async (_case, partialSeed, expectedMessage) => {
      const database = createDatabase(getDatabaseUrl())
      try {
        await expect(
          seedCoins(database, {
            issuers: [{ name: "Test Issuer", code: "TI" }],
            engravers: [],
            ...partialSeed,
          })
        ).rejects.toThrow(expectedMessage)

        await expect(database.listCoins()).resolves.toEqual({
          coins: [],
          totalItems: 0,
        })
      } finally {
        await database.close()
      }
    }
  )
})
