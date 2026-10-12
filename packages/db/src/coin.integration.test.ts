import { sql } from "drizzle-orm"
import { drizzle } from "drizzle-orm/node-postgres"
import { migrate } from "drizzle-orm/node-postgres/migrator"
import { Pool } from "pg"
import { beforeEach, describe, expect, it } from "vitest"

import {
  coinRecordSchema,
  createDatabase,
  engraverRecordSchema,
  issuerRecordSchema,
  readCoinSeed,
  seedCoins,
} from "./index.js"

const SEEDED_COIN_ID = "00000000-0000-4000-8000-000000000001"
const FIRST_ENGRAVER_SLUG = "first-engraver"
const SECOND_ENGRAVER_SLUG = "second-engraver"

async function insertArgentina(database: ReturnType<typeof createDatabase>) {
  const [issuer] = await database.orm
    .insert(database.schema.issuers)
    .values({ name: "Argentina", code: "AR" })
    .returning()
  return issuer
}

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

describe("Coin persistence", () => {
  it("requires stable unique Engraver Slugs while allowing duplicate full names", async () => {
    const database = createDatabase(getDatabaseUrl())
    try {
      const [engraver, sameName] = await database.orm
        .insert(database.schema.engravers)
        .values([
          { slug: "first-engraver", fullName: "Reusable Engraver" },
          { slug: "second-engraver", fullName: "Reusable Engraver" },
        ])
        .returning()

      expect(sameName.fullName).toBe(engraver.fullName)
      await expect(
        database.orm.execute(
          sql`insert into engravers (full_name) values ('Missing Slug')`
        )
      ).rejects.toThrow()
      await expect(
        database.orm.insert(database.schema.engravers).values({
          slug: engraver.slug,
          fullName: "Different Name",
        })
      ).rejects.toThrow()
      for (const slug of [
        "ab",
        "a".repeat(65),
        "Invalid-slug",
        "invalid_slug",
        "-invalid-slug",
        "invalid-slug-",
        "invalid--slug",
      ]) {
        await expect(
          database.orm.insert(database.schema.engravers).values({
            slug,
            fullName: "Invalid Slug",
          })
        ).rejects.toThrow()
      }

      await database.orm
        .update(database.schema.engravers)
        .set({ fullName: "Updated Engraver" })
        .where(sql`${database.schema.engravers.id} = ${engraver.id}`)
      const [updated] = await database.orm
        .select()
        .from(database.schema.engravers)
        .where(sql`${database.schema.engravers.id} = ${engraver.id}`)

      expect(updated.slug).toBe("first-engraver")
    } finally {
      await database.close()
    }
  })

  it("persists a Coin Surface whose only catalogue data is an Engraver credit", async () => {
    const database = createDatabase(getDatabaseUrl())
    try {
      const issuer = await insertArgentina(database)
      const [coin] = await database.orm
        .insert(database.schema.coins)
        .values({ title: "Credit-only Coin", issuerId: issuer.id })
        .returning()
      const [engraver] = await database.orm
        .insert(database.schema.engravers)
        .values({ slug: "credited-engraver", fullName: "Credited Engraver" })
        .returning()

      let obverseId = ""
      await database.orm.transaction(async (transaction) => {
        const [obverse] = await transaction
          .insert(database.schema.coinSurfaces)
          .values({ coinId: coin.id, kind: "obverse" })
          .returning()
        obverseId = obverse.id
        await transaction.insert(database.schema.coinSurfaceEngravers).values({
          coinSurfaceId: obverse.id,
          engraverId: engraver.id,
          position: 1,
        })
      })

      await expect(database.findCoinById(coin.id)).resolves.toMatchObject({
        obverse: {
          description: null,
          imageKey: null,
          engravers: [engraver],
        },
      })
      await expect(
        database.orm.execute(sql`
          delete from coin_surface_engravers
          where coin_surface_id = ${obverseId}
        `)
      ).rejects.toThrow()
    } finally {
      await database.close()
    }
  })

  it("reads ordered reusable Engraver credits on Obverse and Reverse", async () => {
    const database = createDatabase(getDatabaseUrl())
    try {
      const issuer = await insertArgentina(database)
      const [coin] = await database.orm
        .insert(database.schema.coins)
        .values({ title: "Credited Coin", issuerId: issuer.id })
        .returning()
      const [obverse, reverse] = await database.orm
        .insert(database.schema.coinSurfaces)
        .values([
          { coinId: coin.id, kind: "obverse", description: "Portrait" },
          { coinId: coin.id, kind: "reverse", description: "Arms" },
        ])
        .returning()
      const [first, second] = await database.orm
        .insert(database.schema.engravers)
        .values([
          { slug: "first-engraver", fullName: "First Engraver" },
          { slug: "second-engraver", fullName: "Second Engraver" },
        ])
        .returning()

      await database.orm.insert(database.schema.coinSurfaceEngravers).values([
        { coinSurfaceId: obverse.id, engraverId: second.id, position: 2 },
        { coinSurfaceId: obverse.id, engraverId: first.id, position: 1 },
        { coinSurfaceId: reverse.id, engraverId: first.id, position: 1 },
      ])

      await expect(database.findCoinById(coin.id)).resolves.toEqual({
        ...coin,
        issuer,
        obverse: { ...obverse, engravers: [first, second] },
        reverse: { ...reverse, engravers: [first] },
        edge: null,
      })
    } finally {
      await database.close()
    }
  })

  it("enforces Engraver identity, names, timestamps, and credit invariants", async () => {
    const database = createDatabase(getDatabaseUrl())
    try {
      const issuer = await insertArgentina(database)
      const [coin] = await database.orm
        .insert(database.schema.coins)
        .values({ title: "Invariant Coin", issuerId: issuer.id })
        .returning()
      const [obverse, edge] = await database.orm
        .insert(database.schema.coinSurfaces)
        .values([
          { coinId: coin.id, kind: "obverse", description: "Portrait" },
          { coinId: coin.id, kind: "edge", description: "Reeded" },
        ])
        .returning()
      const [engraver, sameName] = await database.orm
        .insert(database.schema.engravers)
        .values([
          { slug: "reusable-engraver", fullName: "Reusable Engraver" },
          { slug: "same-name-engraver", fullName: "Reusable Engraver" },
        ])
        .returning()

      expect(engraverRecordSchema.parse(engraver)).toEqual(engraver)
      expect(engraver.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
      )
      expect(sameName.fullName).toBe(engraver.fullName)
      await expect(
        database.orm
          .insert(database.schema.engravers)
          .values({ slug: "padded-engraver", fullName: " padded" })
      ).rejects.toThrow()
      await expect(
        database.orm.insert(database.schema.coinSurfaceEngravers).values({
          coinSurfaceId: obverse.id,
          engraverId: engraver.id,
          position: 0,
        })
      ).rejects.toThrow()
      await expect(
        database.orm.insert(database.schema.coinSurfaceEngravers).values({
          coinSurfaceId: edge.id,
          engraverId: engraver.id,
          position: 1,
        })
      ).rejects.toThrow()
      await expect(
        database.orm.insert(database.schema.coinSurfaceEngravers).values({
          coinSurfaceId: obverse.id,
          engraverId: "30000000-0000-4000-8000-000000000099",
          position: 1,
        })
      ).rejects.toThrow()

      await database.orm.insert(database.schema.coinSurfaceEngravers).values({
        coinSurfaceId: obverse.id,
        engraverId: engraver.id,
        position: 1,
      })
      await database.orm
        .delete(database.schema.coinSurfaces)
        .where(sql`${database.schema.coinSurfaces.id} = ${edge.id}`)
      await expect(
        database.orm
          .update(database.schema.coinSurfaces)
          .set({ kind: "edge" })
          .where(sql`${database.schema.coinSurfaces.id} = ${obverse.id}`)
      ).rejects.toThrow()
      await expect(
        database.orm.insert(database.schema.coinSurfaceEngravers).values({
          coinSurfaceId: obverse.id,
          engraverId: sameName.id,
          position: 1,
        })
      ).rejects.toThrow()
      await expect(
        database.orm
          .delete(database.schema.engravers)
          .where(sql`${database.schema.engravers.id} = ${engraver.id}`)
      ).rejects.toThrow()

      await database.orm.execute(sql`
        update engravers
        set full_name = 'Updated Engraver', updated_at = created_at
        where id = ${engraver.id}
      `)
      const [updated] = await database.orm
        .select()
        .from(database.schema.engravers)
        .where(sql`${database.schema.engravers.id} = ${engraver.id}`)
      expect(updated.updatedAt.getTime()).toBeGreaterThan(
        engraver.updatedAt.getTime()
      )

      await database.orm
        .delete(database.schema.coinSurfaces)
        .where(sql`${database.schema.coinSurfaces.id} = ${obverse.id}`)
      await expect(
        database.orm.select().from(database.schema.coinSurfaceEngravers)
      ).resolves.toEqual([])
      await expect(
        database.orm
          .delete(database.schema.engravers)
          .where(sql`${database.schema.engravers.id} = ${engraver.id}`)
      ).resolves.toBeDefined()
    } finally {
      await database.close()
    }
  })

  it("serializes Engraver credits with changes to Edge", async () => {
    const database = createDatabase(getDatabaseUrl())
    const concurrentDatabase = createDatabase(getDatabaseUrl())
    try {
      const issuer = await insertArgentina(database)
      const [coin] = await database.orm
        .insert(database.schema.coins)
        .values({ title: "Concurrent Coin", issuerId: issuer.id })
        .returning()
      const [obverse] = await database.orm
        .insert(database.schema.coinSurfaces)
        .values({
          coinId: coin.id,
          kind: "obverse",
          description: "Portrait",
        })
        .returning()
      const [engraver] = await database.orm
        .insert(database.schema.engravers)
        .values({
          slug: "concurrent-engraver",
          fullName: "Concurrent Engraver",
        })
        .returning()

      let creditInserted: () => void = () => {}
      const creditIsInserted = new Promise<void>((resolve) => {
        creditInserted = resolve
      })
      let allowCreditCommit: () => void = () => {}
      const creditMayCommit = new Promise<void>((resolve) => {
        allowCreditCommit = resolve
      })
      const creditTransaction = database.orm.transaction(
        async (transaction) => {
          await transaction
            .insert(database.schema.coinSurfaceEngravers)
            .values({
              coinSurfaceId: obverse.id,
              engraverId: engraver.id,
              position: 1,
            })
          creditInserted()
          await creditMayCommit
        }
      )

      await creditIsInserted
      const changeToEdge = concurrentDatabase.orm
        .update(concurrentDatabase.schema.coinSurfaces)
        .set({ kind: "edge" })
        .where(
          sql`${concurrentDatabase.schema.coinSurfaces.id} = ${obverse.id}`
        )
      const changeOutcome = changeToEdge.then(
        () => "resolved" as const,
        () => "rejected" as const
      )
      const initialOutcome = await Promise.race([
        changeOutcome,
        new Promise<"pending">((resolve) =>
          setTimeout(() => resolve("pending"), 100)
        ),
      ])

      allowCreditCommit()
      await creditTransaction
      expect(initialOutcome).toBe("pending")
      await expect(changeOutcome).resolves.toBe("rejected")
    } finally {
      await concurrentDatabase.close()
      await database.close()
    }
  })

  it("reads sparse catalogue data without creating empty Coin Surfaces", async () => {
    const database = createDatabase(getDatabaseUrl())
    try {
      const issuer = await insertArgentina(database)
      const [
        withAllSurfaces,
        withPartialReverse,
        withPartialEdge,
        withoutSurfaces,
      ] = await database.orm
        .insert(database.schema.coins)
        .values([
          { title: "Coin with all surfaces", issuerId: issuer.id },
          { title: "Coin with a partial Reverse", issuerId: issuer.id },
          { title: "Coin with a partial Edge", issuerId: issuer.id },
          { title: "Coin without surfaces", issuerId: issuer.id },
        ])
        .returning()
      const [obverse, reverse, edge, partialReverse, partialEdge] =
        await database.orm
          .insert(database.schema.coinSurfaces)
          .values([
            {
              coinId: withAllSurfaces.id,
              kind: "obverse",
              description: "A portrait of the sovereign",
              imageKey: "coins/first/obverse.webp",
            },
            {
              coinId: withAllSurfaces.id,
              kind: "reverse",
              description: "The national coat of arms",
              imageKey: "coins/first/reverse.webp",
            },
            {
              coinId: withAllSurfaces.id,
              kind: "edge",
              description: "A lettered inscription",
              imageKey: "coins/first/edge.webp",
            },
            {
              coinId: withPartialReverse.id,
              kind: "reverse",
              description: "A wreath around the denomination",
            },
            {
              coinId: withPartialEdge.id,
              kind: "edge",
              imageKey: "coins/partial/edge.webp",
            },
          ])
          .returning()

      await expect(database.findCoinById(withAllSurfaces.id)).resolves.toEqual({
        ...withAllSurfaces,
        issuer,
        obverse: { ...obverse, engravers: [] },
        reverse: { ...reverse, engravers: [] },
        edge,
      })
      await expect(
        database.findCoinById(withPartialReverse.id)
      ).resolves.toEqual({
        ...withPartialReverse,
        issuer,
        obverse: null,
        reverse: { ...partialReverse, engravers: [] },
        edge: null,
      })
      await expect(database.findCoinById(withPartialEdge.id)).resolves.toEqual({
        ...withPartialEdge,
        issuer,
        obverse: null,
        reverse: null,
        edge: partialEdge,
      })
      await expect(database.findCoinById(withoutSurfaces.id)).resolves.toEqual({
        ...withoutSurfaces,
        issuer,
        obverse: null,
        reverse: null,
        edge: null,
      })
      await expect(database.listCoins()).resolves.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: withoutSurfaces.id,
            obverseImageKey: null,
            reverseImageKey: null,
          }),
          expect.objectContaining({
            id: withAllSurfaces.id,
            obverseImageKey: "coins/first/obverse.webp",
            reverseImageKey: "coins/first/reverse.webp",
          }),
          expect.objectContaining({
            id: withPartialReverse.id,
            obverseImageKey: null,
            reverseImageKey: null,
          }),
        ])
      )
    } finally {
      await database.close()
    }
  })

  it("allows one Coin Surface of each constrained kind per Coin", async () => {
    const database = createDatabase(getDatabaseUrl())
    try {
      const issuer = await insertArgentina(database)
      const [coin] = await database.orm
        .insert(database.schema.coins)
        .values({ title: "Three surfaces", issuerId: issuer.id })
        .returning()

      await database.orm.insert(database.schema.coinSurfaces).values([
        { coinId: coin.id, kind: "obverse", description: "Portrait" },
        { coinId: coin.id, kind: "reverse", imageKey: "reverse.webp" },
        { coinId: coin.id, kind: "edge", description: "Reeded" },
      ])

      await expect(
        database.orm.insert(database.schema.coinSurfaces).values({
          coinId: coin.id,
          kind: "obverse",
          description: "Duplicate portrait",
        })
      ).rejects.toThrow()
      await expect(
        database.orm.execute(sql`
          insert into coin_surfaces (coin_id, kind)
          values (${coin.id}, 'front')
        `)
      ).rejects.toThrow()
    } finally {
      await database.close()
    }
  })

  it("evaluates sparse Coin Surface data from its final transaction state", async () => {
    const database = createDatabase(getDatabaseUrl())
    try {
      const issuer = await insertArgentina(database)
      const [coin] = await database.orm
        .insert(database.schema.coins)
        .values({ title: "Deferred surface data", issuerId: issuer.id })
        .returning()

      await database.orm.transaction(async (transaction) => {
        const [obverse] = await transaction
          .insert(database.schema.coinSurfaces)
          .values({ coinId: coin.id, kind: "obverse" })
          .returning()
        await transaction
          .update(database.schema.coinSurfaces)
          .set({ description: "Portrait added in the same transaction" })
          .where(sql`${database.schema.coinSurfaces.id} = ${obverse.id}`)
      })

      await expect(database.findCoinById(coin.id)).resolves.toMatchObject({
        obverse: { description: "Portrait added in the same transaction" },
      })
    } finally {
      await database.close()
    }
  })

  it.each([
    "",
    " ",
    " padded",
    "padded ",
    "\tpadded",
    "padded\t",
    "\n",
    "x".repeat(10_001),
  ])(
    "rejects the invalid Coin Surface description %j at the database boundary",
    async (description) => {
      const database = createDatabase(getDatabaseUrl())
      try {
        const issuer = await insertArgentina(database)
        const [coin] = await database.orm
          .insert(database.schema.coins)
          .values({ title: "Described Coin", issuerId: issuer.id })
          .returning()

        await expect(
          database.orm.insert(database.schema.coinSurfaces).values({
            coinId: coin.id,
            kind: "obverse",
            description,
          })
        ).rejects.toThrow()
      } finally {
        await database.close()
      }
    }
  )

  it.each([
    "",
    " padded/key.webp",
    "padded/key.webp ",
    "/absolute/key.webp",
    "https://images.example/coin.webp",
    "data:image/webp;base64,AAAA",
    "coins/../secret.webp",
    "./obverse.webp",
    "x".repeat(1_025),
  ])("rejects the invalid R2 object key %j", async (imageKey) => {
    const database = createDatabase(getDatabaseUrl())
    try {
      const issuer = await insertArgentina(database)
      const [coin] = await database.orm
        .insert(database.schema.coins)
        .values({ title: "Coin image", issuerId: issuer.id })
        .returning()

      await expect(
        database.orm.insert(database.schema.coinSurfaces).values({
          coinId: coin.id,
          kind: "obverse",
          imageKey,
        })
      ).rejects.toThrow()
    } finally {
      await database.close()
    }
  })

  it("rejects a Coin Surface without catalogue data", async () => {
    const database = createDatabase(getDatabaseUrl())
    try {
      const issuer = await insertArgentina(database)
      const [coin] = await database.orm
        .insert(database.schema.coins)
        .values({ title: "Empty Surface", issuerId: issuer.id })
        .returning()

      await expect(
        database.orm
          .insert(database.schema.coinSurfaces)
          .values({ coinId: coin.id, kind: "obverse" })
      ).rejects.toThrow()
    } finally {
      await database.close()
    }
  })

  it("uses timezone-aware Coin Surface timestamps and advances modification time", async () => {
    const database = createDatabase(getDatabaseUrl())
    try {
      const issuer = await insertArgentina(database)
      const [coin] = await database.orm
        .insert(database.schema.coins)
        .values({ title: "Timestamped Surface", issuerId: issuer.id })
        .returning()
      const [inserted] = await database.orm
        .insert(database.schema.coinSurfaces)
        .values({
          coinId: coin.id,
          kind: "obverse",
          description: "Before",
        })
        .returning()

      const columns = await database.orm.execute<{
        column_name: string
        data_type: string
        is_nullable: string
      }>(sql`
        select column_name, data_type, is_nullable
        from information_schema.columns
        where table_name = 'coin_surfaces'
          and column_name in ('created_at', 'updated_at')
        order by column_name
      `)
      expect(columns.rows).toEqual([
        {
          column_name: "created_at",
          data_type: "timestamp with time zone",
          is_nullable: "NO",
        },
        {
          column_name: "updated_at",
          data_type: "timestamp with time zone",
          is_nullable: "NO",
        },
      ])

      await database.orm.execute(sql`
        update coin_surfaces
        set description = 'Updated', updated_at = created_at
        where id = ${inserted.id}
      `)
      const [updated] = await database.orm
        .select()
        .from(database.schema.coinSurfaces)
        .where(sql`${database.schema.coinSurfaces.id} = ${inserted.id}`)

      expect(updated.updatedAt.getTime()).toBeGreaterThan(
        inserted.updatedAt.getTime()
      )
    } finally {
      await database.close()
    }
  })

  it("deletes a Coin's catalogue surfaces with the Coin", async () => {
    const database = createDatabase(getDatabaseUrl())
    try {
      const issuer = await insertArgentina(database)
      const [coin] = await database.orm
        .insert(database.schema.coins)
        .values({ title: "Disposable Coin", issuerId: issuer.id })
        .returning()
      const [surface] = await database.orm
        .insert(database.schema.coinSurfaces)
        .values({
          coinId: coin.id,
          kind: "obverse",
          description: "Disposable portrait",
        })
        .returning()
      const [engraver] = await database.orm
        .insert(database.schema.engravers)
        .values({ slug: "surviving-engraver", fullName: "Surviving Engraver" })
        .returning()
      await database.orm.insert(database.schema.coinSurfaceEngravers).values({
        coinSurfaceId: surface.id,
        engraverId: engraver.id,
        position: 1,
      })

      await database.orm
        .delete(database.schema.coins)
        .where(sql`${database.schema.coins.id} = ${coin.id}`)

      await expect(
        database.orm.select().from(database.schema.coinSurfaces)
      ).resolves.toEqual([])
      await expect(
        database.orm.select().from(database.schema.coinSurfaceEngravers)
      ).resolves.toEqual([])
      await expect(
        database.orm.select().from(database.schema.engravers)
      ).resolves.toEqual([engraver])
    } finally {
      await database.close()
    }
  })

  it("lists Coins newest-first with UUID order as the deterministic tie-breaker", async () => {
    const database = createDatabase(getDatabaseUrl())
    try {
      const issuer = await insertArgentina(database)
      const olderId = "00000000-0000-4000-8000-000000000003"
      const firstTiedId = "00000000-0000-4000-8000-000000000001"
      const secondTiedId = "00000000-0000-4000-8000-000000000002"

      await database.orm.insert(database.schema.coins).values([
        {
          id: olderId,
          title: "Older coin",
          issuerId: issuer.id,
          createdAt: new Date("2026-09-15T10:00:00.000Z"),
        },
        {
          id: secondTiedId,
          title: "Second tied coin",
          issuerId: issuer.id,
          createdAt: new Date("2026-09-16T10:00:00.000Z"),
        },
        {
          id: firstTiedId,
          title: "First tied coin",
          issuerId: issuer.id,
          createdAt: new Date("2026-09-16T10:00:00.000Z"),
        },
      ])

      await expect(database.listCoins()).resolves.toEqual([
        expect.objectContaining({ id: firstTiedId }),
        expect.objectContaining({ id: secondTiedId }),
        expect.objectContaining({ id: olderId }),
      ])
    } finally {
      await database.close()
    }
  })

  it("lists only Coins for one exact Issuer Code while preserving order", async () => {
    const database = createDatabase(getDatabaseUrl())
    try {
      const argentina = await insertArgentina(database)
      const [romanEmpire] = await database.orm
        .insert(database.schema.issuers)
        .values({ name: "Roman Empire", code: "ROMAN" })
        .returning()
      const firstTiedId = "00000000-0000-4000-8000-000000000001"
      const secondTiedId = "00000000-0000-4000-8000-000000000002"

      await database.orm.insert(database.schema.coins).values([
        {
          id: secondTiedId,
          title: "Second Roman coin",
          issuerId: romanEmpire.id,
          createdAt: new Date("2026-09-16T10:00:00.000Z"),
        },
        {
          title: "Argentine coin",
          issuerId: argentina.id,
          createdAt: new Date("2026-09-17T10:00:00.000Z"),
        },
        {
          id: firstTiedId,
          title: "First Roman coin",
          issuerId: romanEmpire.id,
          createdAt: new Date("2026-09-16T10:00:00.000Z"),
        },
      ])

      await expect(
        database.listCoins({ issuerCode: "ROMAN" })
      ).resolves.toEqual([
        expect.objectContaining({ id: firstTiedId }),
        expect.objectContaining({ id: secondTiedId }),
      ])
      await expect(
        database.listCoins({ issuerCode: "roman" })
      ).resolves.toEqual([])
      await expect(
        database.listCoins({ issuerCode: "UNKNOWN" })
      ).resolves.toEqual([])
    } finally {
      await database.close()
    }
  })

  it("lists Coins credited to one Engraver on either face once and combines with Issuer filtering", async () => {
    const database = createDatabase(getDatabaseUrl())
    try {
      const argentina = await insertArgentina(database)
      const [romanEmpire] = await database.orm
        .insert(database.schema.issuers)
        .values({ name: "Roman Empire", code: "ROMAN" })
        .returning()
      const [selectedEngraver, otherEngraver] = await database.orm
        .insert(database.schema.engravers)
        .values([
          { slug: "selected-engraver", fullName: "Selected Engraver" },
          { slug: "other-engraver", fullName: "Other Engraver" },
        ])
        .returning()
      const bothFacesId = "00000000-0000-4000-8000-000000000001"
      const obverseId = "00000000-0000-4000-8000-000000000002"
      const reverseId = "00000000-0000-4000-8000-000000000003"
      const edgeOnlyId = "00000000-0000-4000-8000-000000000004"
      const otherEngraverId = "00000000-0000-4000-8000-000000000005"

      await database.orm.insert(database.schema.coins).values([
        {
          id: bothFacesId,
          title: "Both faces",
          issuerId: romanEmpire.id,
          createdAt: new Date("2026-09-17T10:00:00.000Z"),
        },
        {
          id: obverseId,
          title: "Obverse credit",
          issuerId: romanEmpire.id,
          createdAt: new Date("2026-09-16T10:00:00.000Z"),
        },
        {
          id: reverseId,
          title: "Reverse credit",
          issuerId: argentina.id,
          createdAt: new Date("2026-09-18T10:00:00.000Z"),
        },
        {
          id: edgeOnlyId,
          title: "Edge only",
          issuerId: romanEmpire.id,
          createdAt: new Date("2026-09-19T10:00:00.000Z"),
        },
        {
          id: otherEngraverId,
          title: "Other Engraver",
          issuerId: romanEmpire.id,
          createdAt: new Date("2026-09-20T10:00:00.000Z"),
        },
      ])
      const surfaces = await database.orm
        .insert(database.schema.coinSurfaces)
        .values([
          { coinId: bothFacesId, kind: "obverse", description: "Portrait" },
          { coinId: bothFacesId, kind: "reverse", description: "Arms" },
          { coinId: obverseId, kind: "obverse", description: "Portrait" },
          { coinId: reverseId, kind: "reverse", description: "Arms" },
          { coinId: edgeOnlyId, kind: "edge", description: "Lettered" },
          {
            coinId: otherEngraverId,
            kind: "obverse",
            description: "Portrait",
          },
        ])
        .returning()

      const surface = (
        coinId: string,
        kind: "obverse" | "reverse" | "edge"
      ) => {
        const match = surfaces.find(
          (candidate) => candidate.coinId === coinId && candidate.kind === kind
        )
        expect(match).toBeDefined()
        return match!
      }

      await expect(
        database.orm.insert(database.schema.coinSurfaceEngravers).values({
          coinSurfaceId: surface(edgeOnlyId, "edge").id,
          engraverId: selectedEngraver.id,
          position: 1,
        })
      ).rejects.toThrow()

      await database.orm.insert(database.schema.coinSurfaceEngravers).values([
        {
          coinSurfaceId: surface(bothFacesId, "obverse").id,
          engraverId: selectedEngraver.id,
          position: 1,
        },
        {
          coinSurfaceId: surface(bothFacesId, "reverse").id,
          engraverId: selectedEngraver.id,
          position: 1,
        },
        {
          coinSurfaceId: surface(obverseId, "obverse").id,
          engraverId: selectedEngraver.id,
          position: 1,
        },
        {
          coinSurfaceId: surface(reverseId, "reverse").id,
          engraverId: selectedEngraver.id,
          position: 1,
        },
        {
          coinSurfaceId: surface(otherEngraverId, "obverse").id,
          engraverId: otherEngraver.id,
          position: 1,
        },
      ])

      await expect(
        database.listCoins({ engraverSlug: "selected-engraver" })
      ).resolves.toEqual([
        expect.objectContaining({ id: reverseId }),
        expect.objectContaining({ id: bothFacesId }),
        expect.objectContaining({ id: obverseId }),
      ])
      await expect(
        database.listCoins({
          issuerCode: "ROMAN",
          engraverSlug: "selected-engraver",
        })
      ).resolves.toEqual([
        expect.objectContaining({ id: bothFacesId }),
        expect.objectContaining({ id: obverseId }),
      ])
      await expect(
        database.listCoins({ engraverSlug: "unknown-engraver" })
      ).resolves.toEqual([])
    } finally {
      await database.close()
    }
  })

  it("lists no Coins from an empty archive", async () => {
    const database = createDatabase(getDatabaseUrl())
    try {
      await expect(database.listCoins()).resolves.toEqual([])
    } finally {
      await database.close()
    }
  })

  it("stores and looks up a Coin with database-owned identity and timestamps", async () => {
    const database = createDatabase(getDatabaseUrl())
    try {
      const issuer = await insertArgentina(database)
      const [inserted] = await database.orm
        .insert(database.schema.coins)
        .values({ title: "First coin", issuerId: issuer.id })
        .returning()

      expect(inserted).toMatchObject({
        title: "First coin",
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      })
      expect(coinRecordSchema.parse(inserted)).toEqual(inserted)
      expect(inserted.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
      )
      await expect(database.findCoinById(inserted.id)).resolves.toEqual({
        ...inserted,
        issuer,
        obverse: null,
        reverse: null,
        edge: null,
      })
      await expect(
        database.findCoinById("00000000-0000-4000-8000-000000000099")
      ).resolves.toBeNull()
    } finally {
      await database.close()
    }
  })

  it("uses timezone-aware, non-null timestamp columns and non-unique titles", async () => {
    const database = createDatabase(getDatabaseUrl())
    try {
      const issuer = await insertArgentina(database)
      await database.orm.insert(database.schema.coins).values([
        { title: "Shared title", issuerId: issuer.id },
        { title: "Shared title", issuerId: issuer.id },
      ])

      const result = await database.orm.execute<{
        column_name: string
        data_type: string
        is_nullable: string
      }>(sql`
        select column_name, data_type, is_nullable
        from information_schema.columns
        where table_name = 'coins'
          and column_name in ('created_at', 'updated_at')
        order by column_name
      `)

      expect(result.rows).toEqual([
        {
          column_name: "created_at",
          data_type: "timestamp with time zone",
          is_nullable: "NO",
        },
        {
          column_name: "updated_at",
          data_type: "timestamp with time zone",
          is_nullable: "NO",
        },
      ])
    } finally {
      await database.close()
    }
  })

  it.each([
    "",
    " ",
    " padded",
    "padded ",
    "\tpadded",
    "padded\t",
    "\n",
    "x".repeat(201),
  ])("rejects the invalid title %j at the database boundary", async (title) => {
    const database = createDatabase(getDatabaseUrl())
    try {
      const issuer = await insertArgentina(database)
      await expect(
        database.orm
          .insert(database.schema.coins)
          .values({ title, issuerId: issuer.id })
      ).rejects.toThrow()
    } finally {
      await database.close()
    }
  })

  it("automatically advances the modification timestamp on changes", async () => {
    const database = createDatabase(getDatabaseUrl())
    try {
      const issuer = await insertArgentina(database)
      const [inserted] = await database.orm
        .insert(database.schema.coins)
        .values({ title: "Before", issuerId: issuer.id })
        .returning()
      await database.orm.execute(sql`
        update coins
        set title = 'After', updated_at = created_at
        where id = ${inserted.id}
      `)

      const updated = await database.findCoinById(inserted.id)
      expect(updated?.updatedAt.getTime()).toBeGreaterThan(
        inserted.updatedAt.getTime()
      )
    } finally {
      await database.close()
    }
  })
})

describe("Issuer persistence", () => {
  it("lists every Issuer by name and then Issuer Code, including Issuers without Coins", async () => {
    const database = createDatabase(getDatabaseUrl())
    try {
      const argentina = await insertArgentina(database)
      await database.orm.insert(database.schema.issuers).values([
        { name: "Roman Empire", code: "ROMAN" },
        { name: "Argentina", code: "ARG-HIST" },
      ])
      await database.orm
        .insert(database.schema.coins)
        .values({ title: "First coin", issuerId: argentina.id })

      await expect(database.listIssuers()).resolves.toEqual([
        expect.objectContaining({ name: "Argentina", code: "AR" }),
        expect.objectContaining({ name: "Argentina", code: "ARG-HIST" }),
        expect.objectContaining({ name: "Roman Empire", code: "ROMAN" }),
      ])
    } finally {
      await database.close()
    }
  })

  it("stores reusable Issuers with database-owned identity and timestamps", async () => {
    const database = createDatabase(getDatabaseUrl())
    try {
      const argentina = await insertArgentina(database)
      const [duplicateName] = await database.orm
        .insert(database.schema.issuers)
        .values({ name: "Argentina", code: "ARG-HIST" })
        .returning()

      expect(issuerRecordSchema.parse(argentina)).toEqual(argentina)
      expect(argentina).toMatchObject({
        name: "Argentina",
        code: "AR",
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      })
      expect(argentina.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
      )
      expect(duplicateName.name).toBe("Argentina")
    } finally {
      await database.close()
    }
  })

  it.each(["", " ", " padded", "padded ", "x".repeat(201)])(
    "rejects the invalid Issuer name %j at the database boundary",
    async (name) => {
      const database = createDatabase(getDatabaseUrl())
      try {
        await expect(
          database.orm
            .insert(database.schema.issuers)
            .values({ name, code: "AR" })
        ).rejects.toThrow()
      } finally {
        await database.close()
      }
    }
  )

  it.each(["", " ", "ar", " AR", "AR ", "A", "ABC_123", "ABCDEFGHIJKLM"])(
    "rejects the invalid Issuer Code %j at the database boundary",
    async (code) => {
      const database = createDatabase(getDatabaseUrl())
      try {
        await expect(
          database.orm
            .insert(database.schema.issuers)
            .values({ name: "Invalid code", code })
        ).rejects.toThrow()
      } finally {
        await database.close()
      }
    }
  )

  it("requires unique Issuer Codes and prevents deleting an Issuer in use", async () => {
    const database = createDatabase(getDatabaseUrl())
    try {
      const issuer = await insertArgentina(database)
      await expect(
        database.orm
          .insert(database.schema.issuers)
          .values({ name: "Duplicate code", code: "AR" })
      ).rejects.toThrow()

      await database.orm
        .insert(database.schema.coins)
        .values({ title: "First coin", issuerId: issuer.id })
      await expect(
        database.orm
          .delete(database.schema.issuers)
          .where(sql`${database.schema.issuers.id} = ${issuer.id}`)
      ).rejects.toThrow()
    } finally {
      await database.close()
    }
  })

  it("automatically advances the modification timestamp on changes", async () => {
    const database = createDatabase(getDatabaseUrl())
    try {
      const issuer = await insertArgentina(database)
      await database.orm.execute(sql`
        update issuers
        set name = 'Argentine Republic', updated_at = created_at
        where id = ${issuer.id}
      `)
      const [updated] = await database.orm
        .select()
        .from(database.schema.issuers)

      expect(updated.updatedAt.getTime()).toBeGreaterThan(
        issuer.updatedAt.getTime()
      )
    } finally {
      await database.close()
    }
  })
})

describe("Engraver list", () => {
  it("lists every Engraver by full name and then Slug, including uncredited Engravers", async () => {
    const database = createDatabase(getDatabaseUrl())
    try {
      const [credited] = await database.orm
        .insert(database.schema.engravers)
        .values([
          { slug: "zeta-engraver", fullName: "Duplicate Name" },
          { slug: "alpha-engraver", fullName: "Duplicate Name" },
          { slug: "uncredited-engraver", fullName: "Uncredited Engraver" },
        ])
        .returning()
      const issuer = await insertArgentina(database)
      const [coin] = await database.orm
        .insert(database.schema.coins)
        .values({ title: "Credited Coin", issuerId: issuer.id })
        .returning()
      const [obverse] = await database.orm
        .insert(database.schema.coinSurfaces)
        .values({
          coinId: coin.id,
          kind: "obverse",
          description: "Credited design",
        })
        .returning()
      await database.orm.insert(database.schema.coinSurfaceEngravers).values({
        coinSurfaceId: obverse.id,
        engraverId: credited.id,
        position: 1,
      })

      await expect(database.listEngravers()).resolves.toEqual([
        expect.objectContaining({
          slug: "alpha-engraver",
          fullName: "Duplicate Name",
        }),
        expect.objectContaining({
          slug: "zeta-engraver",
          fullName: "Duplicate Name",
        }),
        expect.objectContaining({
          slug: "uncredited-engraver",
          fullName: "Uncredited Engraver",
        }),
      ])
    } finally {
      await database.close()
    }
  })
})

describe("Coin seed", () => {
  const validSeed = {
    issuers: [{ name: "Argentina", code: "AR" }],
    engravers: [
      { slug: FIRST_ENGRAVER_SLUG, fullName: "First Engraver" },
      { slug: SECOND_ENGRAVER_SLUG, fullName: "Second Engraver" },
    ],
    coins: [
      {
        id: SEEDED_COIN_ID,
        title: "First coin",
        issuerCode: "AR",
        obverse: {
          description: "A sun with a human face",
          imageKey: "coins/first/obverse.webp",
          engraverSlugs: [SECOND_ENGRAVER_SLUG, FIRST_ENGRAVER_SLUG],
        },
        reverse: {
          description: "The national coat of arms",
          imageKey: "coins/first/reverse.webp",
          engraverSlugs: [FIRST_ENGRAVER_SLUG],
        },
        edge: {
          description: "A lettered inscription",
          imageKey: "coins/first/edge.webp",
        },
      },
    ],
  }

  it("inserts a Coin Surface whose only seeded data is an Engraver credit", async () => {
    const database = createDatabase(getDatabaseUrl())
    try {
      await seedCoins(database, {
        issuers: validSeed.issuers,
        engravers: [validSeed.engravers[0]],
        coins: [
          {
            id: SEEDED_COIN_ID,
            title: "Credit-only Coin",
            issuerCode: "AR",
            obverse: { engraverSlugs: [FIRST_ENGRAVER_SLUG] },
          },
        ],
      })

      await expect(
        database.findCoinById(SEEDED_COIN_ID)
      ).resolves.toMatchObject({
        obverse: {
          description: null,
          imageKey: null,
          engravers: [{ slug: FIRST_ENGRAVER_SLUG }],
        },
      })
    } finally {
      await database.close()
    }
  })

  it("inserts stable ordered Engravers and reuses them across Coin Surfaces", async () => {
    const database = createDatabase(getDatabaseUrl())
    try {
      await seedCoins(database, validSeed)

      await expect(
        database.findCoinById(SEEDED_COIN_ID)
      ).resolves.toMatchObject({
        obverse: {
          engravers: [
            { slug: SECOND_ENGRAVER_SLUG, fullName: "Second Engraver" },
            { slug: FIRST_ENGRAVER_SLUG, fullName: "First Engraver" },
          ],
        },
        reverse: {
          engravers: [
            { slug: FIRST_ENGRAVER_SLUG, fullName: "First Engraver" },
          ],
        },
        edge: expect.not.objectContaining({ engravers: expect.anything() }),
      })
    } finally {
      await database.close()
    }
  })

  it("inserts validated Coin Surfaces in the same transaction as their Coin", async () => {
    const database = createDatabase(getDatabaseUrl())
    try {
      await seedCoins(database, validSeed)

      await expect(
        database.findCoinById(SEEDED_COIN_ID)
      ).resolves.toMatchObject({
        obverse: {
          coinId: SEEDED_COIN_ID,
          kind: "obverse",
          description: "A sun with a human face",
          imageKey: "coins/first/obverse.webp",
        },
        reverse: {
          coinId: SEEDED_COIN_ID,
          kind: "reverse",
          description: "The national coat of arms",
          imageKey: "coins/first/reverse.webp",
        },
        edge: {
          coinId: SEEDED_COIN_ID,
          kind: "edge",
          description: "A lettered inscription",
          imageKey: "coins/first/edge.webp",
        },
      })
    } finally {
      await database.close()
    }
  })

  it("inserts the complete validated seed document", async () => {
    const database = createDatabase(getDatabaseUrl())
    try {
      await seedCoins(database, await readCoinSeed())
      await expect(
        database.findCoinById(SEEDED_COIN_ID)
      ).resolves.toMatchObject({
        id: SEEDED_COIN_ID,
        title: "400th Anniversary of the First Edition of Don Quixote",
        issuer: expect.objectContaining({ name: "Spain", code: "ES" }),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        obverse: expect.objectContaining({
          kind: "obverse",
          description: "A portrait of Miguel de Cervantes holding a quill.",
          imageKey: "coin-placeholder.webp",
        }),
        reverse: expect.objectContaining({
          kind: "reverse",
          description: "Don Quixote holding a lance beside two windmills.",
          imageKey: "coin-placeholder2.webp",
        }),
        edge: expect.objectContaining({
          kind: "edge",
          description: "CERVANTES repeated around the circumference.",
          imageKey: "coin-placeholder3.webp",
        }),
      })
      await expect(
        database.findCoinById("00000000-0000-4000-8000-000000000002")
      ).resolves.toMatchObject({
        obverse: expect.objectContaining({
          kind: "obverse",
          description: "The Treaty of Rome anniversary emblem.",
          imageKey: "coin-placeholder2.webp",
        }),
        reverse: null,
        edge: null,
      })
      await expect(
        database.findCoinById("00000000-0000-4000-8000-000000000003")
      ).resolves.toMatchObject({
        obverse: null,
        reverse: expect.objectContaining({
          kind: "reverse",
          description: null,
          imageKey: "coin-placeholder3.webp",
        }),
        edge: null,
      })
      await expect(
        database.findCoinById("00000000-0000-4000-8000-000000000030")
      ).resolves.toMatchObject({
        id: "00000000-0000-4000-8000-000000000030",
        issuer: expect.objectContaining({
          name: "Roman Empire",
          code: "ROMAN",
        }),
        obverse: null,
        reverse: null,
        edge: null,
      })
    } finally {
      await database.close()
    }
  })

  it("validates the complete document before writing any records", async () => {
    const database = createDatabase(getDatabaseUrl())
    try {
      await expect(
        seedCoins(database, {
          issuers: validSeed.issuers,
          engravers: validSeed.engravers,
          coins: [
            validSeed.coins[0],
            { id: "not-a-uuid", title: "Invalid", issuerCode: "AR" },
          ],
        })
      ).rejects.toThrow()
      await expect(database.findCoinById(SEEDED_COIN_ID)).resolves.toBeNull()
    } finally {
      await database.close()
    }
  })

  it.each([
    ["an empty Obverse", {}],
    ["a padded description", { description: " padded" }],
    [
      "a complete image URL",
      { imageKey: "https://images.example/obverse.webp" },
    ],
  ])("rejects %s before writing any records", async (_case, obverse) => {
    const database = createDatabase(getDatabaseUrl())
    try {
      await expect(
        seedCoins(database, {
          issuers: validSeed.issuers,
          engravers: validSeed.engravers,
          coins: [{ ...validSeed.coins[0], obverse }],
        })
      ).rejects.toThrow()
      await expect(database.findCoinById(SEEDED_COIN_ID)).resolves.toBeNull()
    } finally {
      await database.close()
    }
  })

  it.each(["ar", " AR", "AR ", "", "ABC_123", "ABCDEFGHIJKLM"])(
    "rejects the invalid Issuer Code %j before writing any records",
    async (code) => {
      const database = createDatabase(getDatabaseUrl())
      try {
        await expect(
          seedCoins(database, {
            issuers: [{ name: "Argentina", code }],
            engravers: validSeed.engravers,
            coins: [{ ...validSeed.coins[0], issuerCode: code }],
          })
        ).rejects.toThrow()
        await expect(database.listCoins()).resolves.toEqual([])
      } finally {
        await database.close()
      }
    }
  )

  it.each(["", " Argentina", "Argentina ", "x".repeat(201)])(
    "rejects the invalid Issuer name %j before writing any records",
    async (name) => {
      const database = createDatabase(getDatabaseUrl())
      try {
        await expect(
          seedCoins(database, {
            issuers: [{ name, code: "AR" }],
            engravers: validSeed.engravers,
            coins: validSeed.coins,
          })
        ).rejects.toThrow()
        await expect(database.listCoins()).resolves.toEqual([])
      } finally {
        await database.close()
      }
    }
  )

  it.each([
    [
      "an unknown Coin relationship",
      {
        issuers: validSeed.issuers,
        engravers: validSeed.engravers,
        coins: [{ ...validSeed.coins[0], issuerCode: "UY" }],
      },
    ],
    [
      "a duplicate Issuer Code",
      {
        issuers: [
          ...validSeed.issuers,
          { name: "Argentine Republic", code: "AR" },
        ],
        engravers: validSeed.engravers,
        coins: validSeed.coins,
      },
    ],
    [
      "a duplicate Engraver reference on one Coin Surface",
      {
        issuers: validSeed.issuers,
        engravers: validSeed.engravers,
        coins: [
          {
            ...validSeed.coins[0],
            obverse: {
              ...validSeed.coins[0].obverse,
              engraverSlugs: [FIRST_ENGRAVER_SLUG, FIRST_ENGRAVER_SLUG],
            },
          },
        ],
      },
    ],
    [
      "an unknown Engraver reference",
      {
        issuers: validSeed.issuers,
        engravers: validSeed.engravers,
        coins: [
          {
            ...validSeed.coins[0],
            reverse: {
              ...validSeed.coins[0].reverse,
              engraverSlugs: ["unknown-engraver"],
            },
          },
        ],
      },
    ],
  ])("validates %s before attempting writes", async (_case, seed) => {
    const database = createDatabase(getDatabaseUrl())
    try {
      await database.orm.execute(sql`create sequence issuer_write_attempts`)
      await database.orm.execute(sql`
        create function record_issuer_write_attempt() returns trigger as $$
        begin
          perform nextval('issuer_write_attempts');
          return new;
        end;
        $$ language plpgsql
      `)
      await database.orm.execute(sql`
        create trigger record_issuer_write_attempt
        before insert on issuers
        for each row execute function record_issuer_write_attempt()
      `)

      await expect(seedCoins(database, seed)).rejects.toThrow()

      const result = await database.orm.execute<{ is_called: boolean }>(sql`
        select is_called from issuer_write_attempts
      `)
      expect(result.rows).toEqual([{ is_called: false }])
    } finally {
      await database.close()
    }
  })

  it("rolls back all records when any insert fails", async () => {
    const database = createDatabase(getDatabaseUrl())
    try {
      const duplicateId = "00000000-0000-4000-8000-000000000002"
      await database.orm.insert(database.schema.coins).values({
        id: duplicateId,
        title: "Existing",
        issuerId: (await insertArgentina(database)).id,
      })

      await expect(
        seedCoins(database, {
          issuers: [{ name: "Uruguay", code: "UY" }],
          engravers: validSeed.engravers,
          coins: [
            { ...validSeed.coins[0], issuerCode: "UY" },
            { id: duplicateId, title: "Duplicate", issuerCode: "UY" },
          ],
        })
      ).rejects.toThrow()
      await expect(database.findCoinById(SEEDED_COIN_ID)).resolves.toBeNull()
    } finally {
      await database.close()
    }
  })

  it("rejects reseeding without changing the existing Coin", async () => {
    const database = createDatabase(getDatabaseUrl())
    try {
      await seedCoins(database, validSeed)
      const before = await database.findCoinById(SEEDED_COIN_ID)

      await expect(seedCoins(database, validSeed)).rejects.toThrow()
      await expect(database.findCoinById(SEEDED_COIN_ID)).resolves.toEqual(
        before
      )
    } finally {
      await database.close()
    }
  })
})
