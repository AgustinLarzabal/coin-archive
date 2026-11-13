import { sql } from "drizzle-orm"
import { drizzle } from "drizzle-orm/node-postgres"
import { migrate } from "drizzle-orm/node-postgres/migrator"
import { Pool } from "pg"
import { beforeEach, describe, expect, it } from "vitest"

import {
  createDatabase,
  rulingAuthoritySelectSchema,
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
        { slug: "shared-b", name: "Shared", role: "Role" },
        { slug: "alpha", name: "Alpha", role: "Role" },
        { slug: "shared-a", name: "Shared", role: "Role" },
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
        .values({
          slug: `test-issuer-${crypto.randomUUID()}`,
          name: "Roman Empire",
          code: "ROMAN",
        })
        .returning()
      const [engraver] = await database.orm
        .insert(database.schema.engravers)
        .values({ slug: "selected-engraver", fullName: "Selected Engraver" })
        .returning()
      const [selectedAuthority, otherAuthority] = await database.orm
        .insert(database.schema.rulingAuthorities)
        .values([
          {
            slug: "selected-authority",
            name: "Selected Authority",
            role: "Emperor",
          },
          { slug: "other-authority", name: "Other Authority", role: "Emperor" },
        ])
        .returning()
      const coins = await database.orm
        .insert(database.schema.coins)
        .values([
          {
            slug: `test-coin-${crypto.randomUUID()}`,
            id: "00000000-0000-4000-8000-000000000001",
            title: "First match",
            issuerId: issuer.id,
            distributionId: sql`(select id from distributions where slug = ${"standard-circulation"})`,
            firstIssueYear: -30,
            lastIssueYear: 1,
            createdAt: new Date("2026-01-02T00:00:00.000Z"),
          },
          {
            slug: `test-coin-${crypto.randomUUID()}`,
            id: "00000000-0000-4000-8000-000000000002",
            title: "Second match",
            issuerId: issuer.id,
            distributionId: sql`(select id from distributions where slug = ${"non-circulating"})`,
            firstIssueYear: -25,
            lastIssueYear: 19,
            createdAt: new Date("2026-01-01T00:00:00.000Z"),
          },
          {
            slug: `test-coin-${crypto.randomUUID()}`,
            id: "00000000-0000-4000-8000-000000000003",
            title: "Other authority",
            issuerId: issuer.id,
            distributionId: sql`(select id from distributions where slug = ${"circulating-commemorative"})`,
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
            position: 1,
          },
          {
            coinId: coins[1].id,
            rulingAuthorityId: selectedAuthority.id,
            position: 1,
          },
          {
            coinId: coins[2].id,
            rulingAuthorityId: otherAuthority.id,
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
          { slug: "first-authority", name: "Shared Name", role: "Role" },
          { slug: "second-authority", name: "Shared Name", role: "Role" },
        ])
        .returning()

      expect(rulingAuthoritySelectSchema.parse(authority)).toEqual(authority)
      expect(authority.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
      )
      expect(sameName.name).toBe(authority.name)
      await expect(
        database.orm.insert(database.schema.rulingAuthorities).values({
          slug: authority.slug,
          name: "Different Name",
          role: "Role",
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

  it("returns ordered authorities and leaves uncurated Coins empty", async () => {
    const database = createDatabase(getDatabaseUrl())
    try {
      const [issuer] = await database.orm
        .insert(database.schema.issuers)
        .values({
          slug: `test-issuer-${crypto.randomUUID()}`,
          name: "Test Issuer",
          code: "TI",
        })
        .returning()
      const [attributedCoin, uncuratedCoin] = await database.orm
        .insert(database.schema.coins)
        .values([
          {
            slug: `test-coin-${crypto.randomUUID()}`,
            title: "Attributed Coin",
            issuerId: issuer.id,
            distributionId: sql`(select id from distributions where slug = ${"circulating-commemorative"})`,
            firstIssueYear: 2004,
            lastIssueYear: 2004,
          },
          {
            slug: `test-coin-${crypto.randomUUID()}`,
            title: "Uncurated Coin",
            issuerId: issuer.id,
            distributionId: sql`(select id from distributions where slug = ${"circulating-commemorative"})`,
            firstIssueYear: 2005,
            lastIssueYear: 2005,
          },
        ])
        .returning()
      const [sharedAuthority, secondAuthority] = await database.orm
        .insert(database.schema.rulingAuthorities)
        .values([
          {
            slug: "shared-authority",
            name: "Shared Authority",
            role: "Second Role",
            tenure: "2001–2004",
          },
          {
            slug: "second-authority",
            name: "Second Authority",
            role: "First Role",
          },
        ])
        .returning()

      await database.orm
        .insert(database.schema.coinRulingAuthorityAttributions)
        .values([
          {
            coinId: attributedCoin.id,
            rulingAuthorityId: sharedAuthority.id,
            position: 2,
          },
          {
            coinId: attributedCoin.id,
            rulingAuthorityId: secondAuthority.id,
            position: 1,
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
        .values({
          slug: `test-issuer-${crypto.randomUUID()}`,
          name: "Test Issuer",
          code: "TI",
        })
        .returning()
      const [coin] = await database.orm
        .insert(database.schema.coins)
        .values({
          slug: `test-coin-${crypto.randomUUID()}`,
          title: "Attributed Coin",
          issuerId: issuer.id,
          distributionId: sql`(select id from distributions where slug = ${"circulating-commemorative"})`,
          firstIssueYear: 2004,
          lastIssueYear: 2004,
        })
        .returning()
      const [authority] = await database.orm
        .insert(database.schema.rulingAuthorities)
        .values({
          slug: "lasting-authority",
          name: "Lasting Authority",
          role: "Role",
        })
        .returning()

      await database.orm
        .insert(database.schema.coinRulingAuthorityAttributions)
        .values({
          coinId: coin.id,
          rulingAuthorityId: authority.id,
          position: 1,
        })

      await expect(
        database.orm
          .insert(database.schema.coinRulingAuthorityAttributions)
          .values({
            coinId: coin.id,
            rulingAuthorityId: authority.id,
            position: 2,
          })
      ).rejects.toThrow()

      for (const position of [0, 1]) {
        await expect(
          database.orm
            .insert(database.schema.coinRulingAuthorityAttributions)
            .values({
              coinId: coin.id,
              rulingAuthorityId: authority.id,
              position,
            })
        ).rejects.toThrow()
      }

      for (const role of ["", " padded"]) {
        await expect(
          database.orm.insert(database.schema.rulingAuthorities).values({
            slug: "invalid-role-authority",
            name: "Invalid Role Authority",
            role,
          })
        ).rejects.toThrow()
      }
      for (const tenure of ["", "padded "]) {
        await expect(
          database.orm.insert(database.schema.rulingAuthorities).values({
            slug: "invalid-tenure-authority",
            name: "Invalid Tenure Authority",
            role: "Role",
            tenure,
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
        issuers: [
          {
            slug: `test-issuer-${crypto.randomUUID()}`,
            name: "Test Issuer",
            code: "TI",
          },
        ],
        engravers: [],
        authorities: [
          {
            slug: "first-authority",
            name: "First Authority",
            role: "First Role",
          },
          {
            slug: "second-authority",
            name: "Second Authority",
            role: "Second Role",
            tenure: "2000–2004",
          },
        ],
        coins: [
          {
            slug: `test-coin-${crypto.randomUUID()}`,
            id: coinId,
            title: "Seeded Coin",
            issuerCode: "TI",
            distribution: "circulating-commemorative",
            firstIssueYear: 2004,
            lastIssueYear: 2004,
            rulingAuthorityAttributions: [
              {
                slug: "second-authority",
                position: 2,
              },
              {
                slug: "first-authority",
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
        authorities: [{ slug: "Bad Slug", name: "Authority", role: "Role" }],
        coins: [],
      },
      "Invalid string",
    ],
    [
      "a malformed authority role",
      {
        authorities: [
          { slug: "known-authority", name: "Authority", role: " padded" },
        ],
        coins: [],
      },
      "must be trimmed",
    ],
    [
      "duplicate attribution positions",
      {
        authorities: [
          { slug: "first-authority", name: "First Authority", role: "Role" },
          { slug: "second-authority", name: "Second Authority", role: "Role" },
        ],
        coins: [
          {
            slug: `test-coin-${crypto.randomUUID()}`,
            id: "00000000-0000-4000-8000-000000000001",
            title: "Duplicate position",
            issuerCode: "TI",
            distribution: "circulating-commemorative",
            firstIssueYear: 2004,
            lastIssueYear: 2004,
            rulingAuthorityAttributions: [
              { slug: "first-authority", position: 1 },
              { slug: "second-authority", position: 1 },
            ],
          },
        ],
      },
      "Duplicate Ruling Authority position: 1",
    ],
    [
      "duplicate authority attributions",
      {
        authorities: [
          { slug: "known-authority", name: "Authority", role: "Role" },
        ],
        coins: [
          {
            slug: `test-coin-${crypto.randomUUID()}`,
            id: "00000000-0000-4000-8000-000000000001",
            title: "Duplicate attribution",
            issuerCode: "TI",
            distribution: "circulating-commemorative",
            firstIssueYear: 2004,
            lastIssueYear: 2004,
            rulingAuthorityAttributions: [
              { slug: "known-authority", position: 1 },
              { slug: "known-authority", position: 2 },
            ],
          },
        ],
      },
      "Duplicate Ruling Authority attribution: known-authority",
    ],
    [
      "an unknown authority reference",
      {
        authorities: [],
        coins: [
          {
            slug: `test-coin-${crypto.randomUUID()}`,
            id: "00000000-0000-4000-8000-000000000001",
            title: "Unknown authority",
            issuerCode: "TI",
            distribution: "circulating-commemorative",
            firstIssueYear: 2004,
            lastIssueYear: 2004,
            rulingAuthorityAttributions: [
              { slug: "missing-authority", position: 1 },
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
            issuers: [
              {
                slug: `test-issuer-${crypto.randomUUID()}`,
                name: "Test Issuer",
                code: "TI",
              },
            ],
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
