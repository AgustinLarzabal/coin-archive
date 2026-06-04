import { randomUUID } from "node:crypto"
import { sql } from "drizzle-orm"
import { describe, expect, it } from "vitest"
import { coin, coinRuler, db, issuer, ruler, rulerGroup } from "../index"
import {
  createCoin,
  createCoinRuler,
  createIssuer,
  createRuler,
  createRulerGroup,
} from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"
import { coinRulerSchemaNames } from "./coin-ruler"
import { issuerSchemaNames } from "./issuer"
import { rulerSchemaNames } from "./ruler"
import { rulerGroupSchemaNames } from "./ruler-group"

async function expectConstraintError(
  promise: Promise<unknown>,
  constraintName: string,
  code: string
) {
  await expect(promise).rejects.toMatchObject({
    cause: expect.objectContaining({
      code,
      constraint_name: constraintName,
    }),
  })
}

describe("issuer schema constraints", () => {
  useTestDatabaseIsolation(db)

  it("rejects issuer codes that are not lowercase slug-style text", async () => {
    await expectConstraintError(
      db.insert(issuer).values({
        code: "Roman Empire",
        name: "Roman Empire",
      }),
      issuerSchemaNames.codeSlugCheck,
      "23514"
    )
  })

  it("rejects duplicate issuer codes", async () => {
    await db.insert(issuer).values({
      code: "roman-empire",
      name: "Roman Empire",
    })

    await expectConstraintError(
      db.insert(issuer).values({
        code: "roman-empire",
        name: "Duplicate Roman Empire",
      }),
      issuerSchemaNames.codeUniqueIndex,
      "23505"
    )
  })

  it("rejects an issuer grouping where the issuer is its own parent", async () => {
    const issuerId = randomUUID()

    await expectConstraintError(
      db.insert(issuer).values({
        id: issuerId,
        code: "self-parented-issuer",
        name: "Self Parented Issuer",
        parentIssuerId: issuerId,
      }),
      issuerSchemaNames.parentIssuerIdSelfCheck,
      "23514"
    )
  })
})

describe("coin schema constraints", () => {
  useTestDatabaseIsolation(db)

  it("requires every coin to have exactly one direct issuer", async () => {
    await expect(
      db.execute(sql`
        insert into "coin" ("title", "issuer_id")
        values (${"Issuerless Test Coin"}, ${null})
      `)
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23502",
        column_name: "issuer_id",
      }),
    })
  })
})

describe("ruler group schema constraints", () => {
  useTestDatabaseIsolation(db)

  it("rejects ruler group codes that are not lowercase slug-style text", async () => {
    await expectConstraintError(
      db.insert(rulerGroup).values({
        code: "House Of Bourbon",
        name: "House of Bourbon",
      }),
      rulerGroupSchemaNames.codeSlugCheck,
      "23514"
    )
  })

  it("rejects duplicate ruler group codes", async () => {
    await db.insert(rulerGroup).values({
      code: "house-of-bourbon",
      name: "House of Bourbon",
    })

    await expectConstraintError(
      db.insert(rulerGroup).values({
        code: "house-of-bourbon",
        name: "Duplicate House of Bourbon",
      }),
      rulerGroupSchemaNames.codeUniqueIndex,
      "23505"
    )
  })
})

describe("ruler schema constraints", () => {
  useTestDatabaseIsolation(db)

  it("rejects ruler codes that are not lowercase slug-style text", async () => {
    await expectConstraintError(
      db.insert(ruler).values({
        code: "Felipe VI",
        name: "Felipe VI",
      }),
      rulerSchemaNames.codeSlugCheck,
      "23514"
    )
  })

  it("rejects duplicate ruler codes", async () => {
    await db.insert(ruler).values({
      code: "felipe-vi",
      name: "Felipe VI",
    })

    await expectConstraintError(
      db.insert(ruler).values({
        code: "felipe-vi",
        name: "Duplicate Felipe VI",
      }),
      rulerSchemaNames.codeUniqueIndex,
      "23505"
    )
  })

  it("allows a ruler without a ruler group", async () => {
    await expect(
      db.insert(ruler).values({
        code: "liberty",
        name: "Liberty",
      })
    ).resolves.toBeDefined()
  })

  it("rejects deleting a ruler group while a ruler still references it", async () => {
    const bourbon = await createRulerGroup({
      code: "house-of-bourbon",
      name: "House of Bourbon",
    })

    await createRuler({
      code: "felipe-vi",
      name: "Felipe VI",
      rulerGroupId: bourbon.id,
    })

    await expectConstraintError(
      db.delete(rulerGroup).where(sql`${rulerGroup.id} = ${bourbon.id}`),
      "ruler_ruler_group_id_ruler_group_id_fk",
      "23503"
    )
  })
})

describe("coin ruler schema constraints", () => {
  useTestDatabaseIsolation(db)

  it("rejects duplicate coin-ruler attributions for the same coin", async () => {
    const athens = await createIssuer({
      code: "athens",
      name: "Athens",
    })
    const civicCoin = await createCoin({
      title: "Civic Bronze",
      issuerId: athens.id,
      createdAt: new Date("2026-06-01T00:00:00.000Z"),
    })
    const liberty = await createRuler({
      code: "liberty",
      name: "Liberty",
    })

    await createCoinRuler({
      coinId: civicCoin.id,
      rulerId: liberty.id,
      rulerOrder: 1,
    })

    await expectConstraintError(
      db.insert(coinRuler).values({
        coinId: civicCoin.id,
        rulerId: liberty.id,
        rulerOrder: 2,
      }),
      coinRulerSchemaNames.coinIdRulerIdPrimaryKey,
      "23505"
    )
  })

  it("rejects duplicate ruler attribution orders on the same coin", async () => {
    const athens = await createIssuer({
      code: "athens",
      name: "Athens",
    })
    const civicCoin = await createCoin({
      title: "Civic Silver",
      issuerId: athens.id,
      createdAt: new Date("2026-06-02T00:00:00.000Z"),
    })
    const liberty = await createRuler({
      code: "liberty",
      name: "Liberty",
    })
    const athena = await createRuler({
      code: "athena",
      name: "Athena",
    })

    await createCoinRuler({
      coinId: civicCoin.id,
      rulerId: liberty.id,
      rulerOrder: 1,
    })

    await expectConstraintError(
      db.insert(coinRuler).values({
        coinId: civicCoin.id,
        rulerId: athena.id,
        rulerOrder: 1,
      }),
      coinRulerSchemaNames.coinIdRulerOrderUniqueIndex,
      "23505"
    )
  })

  it("requires ruler attribution order to be positive", async () => {
    const athens = await createIssuer({
      code: "athens",
      name: "Athens",
    })
    const civicCoin = await createCoin({
      title: "Civic Gold",
      issuerId: athens.id,
      createdAt: new Date("2026-06-03T00:00:00.000Z"),
    })
    const liberty = await createRuler({
      code: "liberty",
      name: "Liberty",
    })

    await expectConstraintError(
      db.insert(coinRuler).values({
        coinId: civicCoin.id,
        rulerId: liberty.id,
        rulerOrder: 0,
      }),
      coinRulerSchemaNames.rulerOrderPositiveCheck,
      "23514"
    )
  })

  it("rejects deleting a ruler while coin attributions still reference it", async () => {
    const athens = await createIssuer({
      code: "athens",
      name: "Athens",
    })
    const civicCoin = await createCoin({
      title: "Civic Electrum",
      issuerId: athens.id,
      createdAt: new Date("2026-06-04T00:00:00.000Z"),
    })
    const liberty = await createRuler({
      code: "liberty",
      name: "Liberty",
    })

    await createCoinRuler({
      coinId: civicCoin.id,
      rulerId: liberty.id,
      rulerOrder: 1,
    })

    await expectConstraintError(
      db.delete(ruler).where(sql`${ruler.id} = ${liberty.id}`),
      "coin_ruler_ruler_id_ruler_id_fk",
      "23503"
    )
  })

  it("deletes coin-ruler attributions when the coin is deleted", async () => {
    const athens = await createIssuer({
      code: "athens",
      name: "Athens",
    })
    const civicCoin = await createCoin({
      title: "Civic Billon",
      issuerId: athens.id,
      createdAt: new Date("2026-06-05T00:00:00.000Z"),
    })
    const liberty = await createRuler({
      code: "liberty",
      name: "Liberty",
    })

    await createCoinRuler({
      coinId: civicCoin.id,
      rulerId: liberty.id,
      rulerOrder: 1,
    })

    await db.delete(coin).where(sql`${coin.id} = ${civicCoin.id}`)

    await expect(
      db
        .select()
        .from(coinRuler)
        .where(sql`${coinRuler.coinId} = ${civicCoin.id}`)
    ).resolves.toStrictEqual([])
  })
})
