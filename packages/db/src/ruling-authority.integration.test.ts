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
  it("lists global authorities by name then Slug", async () => {
    const database = createDatabase(getDatabaseUrl())
    try {
      await database.orm.insert(database.schema.rulingAuthorities).values([
        { slug: "shared-b", name: "Shared" },
        { slug: "alpha", name: "Alpha" },
        { slug: "shared-a", name: "Shared" },
      ])

      await expect(database.listRulingAuthorities()).resolves.toEqual([
        expect.objectContaining({ slug: "alpha", name: "Alpha" }),
        expect.objectContaining({ slug: "shared-a", name: "Shared" }),
        expect.objectContaining({ slug: "shared-b", name: "Shared" }),
      ])
    } finally {
      await database.close()
    }
  })

  it("filters Coins once by exact authority and composes with every filter and pagination", async () => {
    const database = createDatabase(getDatabaseUrl())
    try {
      const [issuer] = await database.orm
        .insert(database.schema.issuers)
        .values({ name: "Roman Empire", code: "ROMAN" })
        .returning()
      const [engraver] = await database.orm
        .insert(database.schema.engravers)
        .values({ slug: "selected-engraver", fullName: "Selected Engraver" })
        .returning()
      const [selectedAuthority, otherAuthority] = await database.orm
        .insert(database.schema.rulingAuthorities)
        .values([
          { slug: "selected-authority", name: "Selected Authority" },
          { slug: "other-authority", name: "Other Authority" },
        ])
        .returning()
      const coins = await database.orm
        .insert(database.schema.coins)
        .values([
          {
            id: "00000000-0000-4000-8000-000000000001",
            title: "First match",
            issuerId: issuer.id,
            distribution: "standard-circulation",
            firstIssueYear: -30,
            lastIssueYear: 1,
            createdAt: new Date("2026-01-02T00:00:00.000Z"),
          },
          {
            id: "00000000-0000-4000-8000-000000000002",
            title: "Second match",
            issuerId: issuer.id,
            distribution: "non-circulating",
            firstIssueYear: -25,
            lastIssueYear: 19,
            createdAt: new Date("2026-01-01T00:00:00.000Z"),
          },
          {
            id: "00000000-0000-4000-8000-000000000003",
            title: "Other authority",
            issuerId: issuer.id,
            distribution: "circulating-commemorative",
            firstIssueYear: -25,
            lastIssueYear: 19,
          },
        ])
        .returning()
      const surfaces = await database.orm
        .insert(database.schema.coinSurfaces)
        .values(
          coins.map((coin) => ({
            coinId: coin.id,
            kind: "obverse" as const,
            description: "Portrait",
          }))
        )
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
        .values([
          {
            coinId: coins[0].id,
            rulingAuthorityId: selectedAuthority.id,
            role: "Emperor",
            position: 1,
          },
          {
            coinId: coins[0].id,
            rulingAuthorityId: selectedAuthority.id,
            role: "Augustus",
            position: 2,
          },
          {
            coinId: coins[1].id,
            rulingAuthorityId: selectedAuthority.id,
            role: "Emperor",
            position: 1,
          },
          {
            coinId: coins[2].id,
            rulingAuthorityId: otherAuthority.id,
            role: "Emperor",
            position: 1,
          },
        ])

      await expect(
        database.listCoins({
          distribution: "non-circulating",
          issuerCode: "ROMAN",
          rulingAuthoritySlug: "selected-authority",
          engraverSlug: "selected-engraver",
          issueYearInterval: { firstIssueYear: -25, lastIssueYear: 19 },
          page: 1,
          pageSize: 1,
        })
      ).resolves.toEqual({
        coins: [expect.objectContaining({ id: coins[1].id })],
        totalItems: 1,
      })
      await expect(
        database.listCoins({ rulingAuthoritySlug: "missing-authority" })
      ).resolves.toEqual({ coins: [], totalItems: 0 })
    } finally {
      await database.close()
    }
  })

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
            distribution: "circulating-commemorative",
            firstIssueYear: 2004,
            lastIssueYear: 2004,
          },
          {
            title: "Uncurated Coin",
            issuerId: issuer.id,
            distribution: "circulating-commemorative",
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
          distribution: "circulating-commemorative",
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

      await expect(
        database.orm
          .insert(database.schema.coinRulingAuthorityAttributions)
          .values({
            coinId: coin.id,
            rulingAuthorityId: authority.id,
            role: "Role",
            tenure: null,
            position: 2,
          })
      ).rejects.toThrow()

      await expect(
        database.orm
          .insert(database.schema.coinRulingAuthorityAttributions)
          .values([
            {
              coinId: coin.id,
              rulingAuthorityId: authority.id,
              role: "Different Role",
              tenure: null,
              position: 2,
            },
            {
              coinId: coin.id,
              rulingAuthorityId: authority.id,
              role: "Role",
              tenure: "Different tenure",
              position: 3,
            },
          ])
      ).resolves.toBeDefined()

      for (const attribution of [
        { role: "", tenure: null, position: 4 },
        { role: " padded", tenure: null, position: 4 },
        { role: "Role", tenure: "", position: 4 },
        { role: "Role", tenure: "padded ", position: 4 },
        { role: "Invalid Position Role", tenure: null, position: 0 },
        { role: "Duplicate Position Role", tenure: null, position: 1 },
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
            distribution: "circulating-commemorative",
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
            distribution: "circulating-commemorative",
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
            distribution: "circulating-commemorative",
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
      "duplicate contextual attributions",
      {
        authorities: [{ slug: "known-authority", name: "Authority" }],
        coins: [
          {
            id: "00000000-0000-4000-8000-000000000001",
            title: "Duplicate attribution",
            issuerCode: "TI",
            distribution: "circulating-commemorative",
            firstIssueYear: 2004,
            lastIssueYear: 2004,
            rulingAuthorityAttributions: [
              { slug: "known-authority", role: "Role", position: 1 },
              { slug: "known-authority", role: "Role", position: 2 },
            ],
          },
        ],
      },
      "Duplicate Ruling Authority attribution: known-authority / Role / no tenure",
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
            distribution: "circulating-commemorative",
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
