import { randomUUID } from "node:crypto"
import { count, eq, sql } from "drizzle-orm"
import { describe, expect, it } from "vitest"
import {
  catalogue,
  coin,
  coinFace,
  coinFaceEngraver,
  coinMint,
  coinReference,
  coinRuler,
  coinTheme,
  composition,
  currency,
  db,
  distribution,
  edge,
  engraver,
  issuer,
  mint,
  orientation,
  rim,
  ruler,
  rulerGroup,
  shape,
  theme,
} from "../index"
import {
  createCatalogue,
  createCoin,
  createCoinFace,
  createCoinFaceEngraver,
  createCoinMint,
  createCoinReference,
  createCoinRuler,
  createCoinTheme,
  createComposition,
  createCurrency,
  createDistribution,
  createEdge,
  createEngraver,
  createIssuer,
  createMint,
  createOrientation,
  createRim,
  createRuler,
  createRulerGroup,
  createShape,
  createTheme,
} from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"
import { catalogueSchemaNames } from "./catalogue"
import { coinFaceSchemaNames } from "./coin-face"
import { coinFaceEngraverSchemaNames } from "./coin-face-engraver"
import { coinReferenceSchemaNames } from "./coin-reference"
import { coinRulerSchemaNames } from "./coin-ruler"
import { coinSchemaNames } from "./coin"
import { compositionSchemaNames } from "./composition"
import { currencySchemaNames } from "./currency"
import { distributionSchemaNames } from "./distribution"
import { edgeSchemaNames } from "./edge"
import { engraverSchemaNames } from "./engraver"
import { issuerSchemaNames } from "./issuer"
import { coinMintSchemaNames } from "./coin-mint"
import { coinThemeSchemaNames } from "./coin-theme"
import { mintSchemaNames } from "./mint"
import { orientationSchemaNames } from "./orientation"
import { rimSchemaNames } from "./rim"
import { rulerSchemaNames } from "./ruler"
import { rulerGroupSchemaNames } from "./ruler-group"
import { shapeSchemaNames } from "./shape"
import { themeSchemaNames } from "./theme"

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

async function expectCountQueryResult(
  countQuery: Promise<Array<{ count: number }>>,
  expectedCount: number
) {
  const [result] = await countQuery

  expect(result?.count).toBe(expectedCount)
}

async function createCoinDependencies() {
  const [createdIssuer, createdDistribution, createdComposition, createdCurrency] =
    await Promise.all([
      createIssuer({
        code: "athens",
        name: "Athens",
      }),
      createDistribution({
        code: "standard-circulation",
        name: "Standard circulation",
      }),
      createComposition({
        code: "silver-900",
        description: "Ninety percent silver alloy.",
        name: "Silver (.900)",
      }),
      createCurrency({
        code: "euro",
        fullName: "Euro (2002-date)",
        name: "Euro",
      }),
    ])

  return {
    compositionId: createdComposition.id,
    currencyId: createdCurrency.id,
    distributionId: createdDistribution.id,
    issuerId: createdIssuer.id,
  }
}

function insertCoinRow(input: {
  compositionId: string | null
  currencyId?: string | null
  distributionId: string | null
  faceValueNumericValue?: number | null
  faceValueText?: string | null
  issuerId: string | null
  minYear?: number
  maxYear?: number
  mintage?: number | null
  title: string
}) {
  return db.execute(sql`
    insert into "coin" (
      "title",
      "issuer_id",
      "distribution_id",
      "composition_id",
      "face_value_text",
      "face_value_numeric_value",
      "currency_id",
      "mintage",
      "min_year",
      "max_year"
    )
    values (
      ${input.title},
      ${input.issuerId},
      ${input.distributionId},
      ${input.compositionId},
      ${input.faceValueText === undefined ? "1 Test Unit" : input.faceValueText},
      ${input.faceValueNumericValue === undefined ? 1 : input.faceValueNumericValue},
      ${input.currencyId === undefined ? null : input.currencyId},
      ${input.mintage === undefined ? null : input.mintage},
      ${input.minYear ?? null},
      ${input.maxYear ?? null}
    )
  `)
}

async function expectCoinRequiredColumnError(input: {
  compositionId: string | null
  currencyId?: string | null
  distributionId: string | null
  issuerId: string | null
  missingColumn:
    | "issuer_id"
    | "distribution_id"
    | "composition_id"
    | "face_value_text"
    | "face_value_numeric_value"
    | "currency_id"
  faceValueNumericValue?: number | null
  faceValueText?: string | null
  title: string
}) {
  await expect(
    insertCoinRow({
      title: input.title,
      issuerId: input.issuerId,
      distributionId: input.distributionId,
      compositionId: input.compositionId,
      currencyId: input.currencyId,
      faceValueNumericValue: input.faceValueNumericValue,
      faceValueText: input.faceValueText,
    })
  ).rejects.toMatchObject({
    cause: expect.objectContaining({
      code: "23502",
      column_name: input.missingColumn,
    }),
  })
}

describe("composition schema constraints", () => {
  useTestDatabaseIsolation(db)

  it("rejects composition codes that are not lowercase slug-style text", async () => {
    await expectConstraintError(
      db.insert(composition).values({
        code: "Silver 900",
        name: "Silver (.900)",
      }),
      compositionSchemaNames.codeSlugCheck,
      "23514"
    )
  })

  it("rejects duplicate composition codes ignoring case", async () => {
    await db.insert(composition).values({
      code: "silver-900",
      name: "Silver (.900)",
    })

    await expectConstraintError(
      db.insert(composition).values({
        code: "SILVER-900",
        name: "Duplicate Silver (.900)",
      }),
      compositionSchemaNames.codeLowerUniqueIndex,
      "23505"
    )
  })

  it("restricts deleting a composition while coins still reference it", async () => {
    const { compositionId, distributionId, issuerId } =
      await createCoinDependencies()

    await createCoin({
      title: "Referenced Composition Coin",
      compositionId,
      distributionId,
      issuerId,
      createdAt: new Date("2026-06-01T12:00:00.000Z"),
    })

    await expectConstraintError(
      db.delete(composition).where(sql`${composition.id} = ${compositionId}`),
      "coin_composition_id_composition_id_fk",
      "23503"
    )
  })
})

describe("currency schema constraints", () => {
  useTestDatabaseIsolation(db)

  it("rejects currency codes that are not lowercase slug-style text", async () => {
    await expectConstraintError(
      db.insert(currency).values({
        code: "United States Dollar",
        name: "United States dollar",
        fullName: "United States dollar",
      }),
      currencySchemaNames.codeSlugCheck,
      "23514"
    )
  })

  it("rejects duplicate currency codes ignoring case", async () => {
    await db.insert(currency).values({
      code: "euro",
      name: "Euro",
      fullName: "Euro (2002-date)",
    })

    await expectConstraintError(
      db.insert(currency).values({
        code: "EURO",
        name: "Duplicate Euro",
        fullName: "Duplicate Euro (2002-date)",
      }),
      currencySchemaNames.codeLowerUniqueIndex,
      "23505"
    )
  })
})

describe("edge schema constraints", () => {
  useTestDatabaseIsolation(db)

  it("rejects edge codes that are not lowercase slug-style text", async () => {
    await expectConstraintError(
      db.insert(edge).values({
        code: "Security Edge",
        name: "Security edge",
      }),
      edgeSchemaNames.codeSlugCheck,
      "23514"
    )
  })

  it("rejects duplicate edge codes ignoring case", async () => {
    await db.insert(edge).values({
      code: "reeded",
      name: "Reeded",
    })

    await expectConstraintError(
      db.insert(edge).values({
        code: "REEDED",
        name: "Duplicate Reeded",
      }),
      edgeSchemaNames.codeLowerUniqueIndex,
      "23505"
    )
  })

  it("restricts deleting an edge while coins still reference it", async () => {
    const { distributionId, issuerId } = await createCoinDependencies()
    const reeded = await createEdge({
      code: "reeded",
      name: "Reeded",
    })

    await createCoin({
      title: "Referenced Edge Coin",
      distributionId,
      edgeId: reeded.id,
      issuerId,
      createdAt: new Date("2026-06-01T12:00:00.000Z"),
    })

    await expectConstraintError(
      db.delete(edge).where(sql`${edge.id} = ${reeded.id}`),
      "coin_edge_id_edge_id_fk",
      "23503"
    )
  })
})

describe("mint schema constraints", () => {
  useTestDatabaseIsolation(db)

  it("rejects mint codes that are not lowercase slug-style text", async () => {
    await expectConstraintError(
      db.insert(mint).values({
        code: "Royal Mint of Madrid",
        name: "Royal Mint of Madrid",
      }),
      mintSchemaNames.codeSlugCheck,
      "23514"
    )
  })

  it("rejects duplicate mint codes ignoring case", async () => {
    await db.insert(mint).values({
      code: "royal-mint-of-madrid",
      name: "Royal Mint of Madrid",
    })

    await expectConstraintError(
      db.insert(mint).values({
        code: "ROYAL-MINT-OF-MADRID",
        name: "Duplicate Royal Mint of Madrid",
      }),
      mintSchemaNames.codeLowerUniqueIndex,
      "23505"
    )
  })

  it("restricts deleting a mint while coins still reference it", async () => {
    const { compositionId, currencyId, distributionId, issuerId } =
      await createCoinDependencies()
    const createdMint = await createMint({
      code: "royal-mint-of-madrid",
      name: "Royal Mint of Madrid",
    })
    const createdCoin = await createCoin({
      title: "Referenced Mint Coin",
      compositionId,
      currencyId,
      distributionId,
      issuerId,
      createdAt: new Date("2026-06-01T12:00:00.000Z"),
    })

    await createCoinMint({
      coinId: createdCoin.id,
      mintId: createdMint.id,
    })

    await expectConstraintError(
      db.delete(mint).where(sql`${mint.id} = ${createdMint.id}`),
      "coin_mint_mint_id_mint_id_fk",
      "23503"
    )
  })
})

describe("theme schema constraints", () => {
  useTestDatabaseIsolation(db)

  it("rejects theme codes that are not lowercase slug-style text", async () => {
    await expectConstraintError(
      db.insert(theme).values({
        code: "National Flag",
        name: "Flag",
      }),
      themeSchemaNames.codeSlugCheck,
      "23514"
    )
  })

  it("rejects duplicate theme codes ignoring case", async () => {
    await db.insert(theme).values({
      code: "flag",
      name: "Flag",
    })

    await expectConstraintError(
      db.insert(theme).values({
        code: "FLAG",
        name: "Duplicate Flag",
      }),
      themeSchemaNames.codeLowerUniqueIndex,
      "23505"
    )
  })

  it("rejects duplicate Theme Attributions for the same coin and theme", async () => {
    const { compositionId, currencyId, distributionId, issuerId } =
      await createCoinDependencies()
    const createdTheme = await createTheme({
      code: "flag",
      name: "Flag",
    })
    const createdCoin = await createCoin({
      title: "Flag Coin",
      compositionId,
      currencyId,
      distributionId,
      issuerId,
      createdAt: new Date("2026-06-01T12:00:00.000Z"),
    })

    await createCoinTheme({
      coinId: createdCoin.id,
      themeId: createdTheme.id,
    })

    await expectConstraintError(
      createCoinTheme({
        coinId: createdCoin.id,
        themeId: createdTheme.id,
      }),
      coinThemeSchemaNames.coinIdThemeIdPrimaryKey,
      "23505"
    )
  })

  it("restricts deleting a theme while coins still reference it", async () => {
    const { compositionId, currencyId, distributionId, issuerId } =
      await createCoinDependencies()
    const createdTheme = await createTheme({
      code: "flag",
      name: "Flag",
    })
    const createdCoin = await createCoin({
      title: "Referenced Theme Coin",
      compositionId,
      currencyId,
      distributionId,
      issuerId,
      createdAt: new Date("2026-06-01T12:00:00.000Z"),
    })

    await createCoinTheme({
      coinId: createdCoin.id,
      themeId: createdTheme.id,
    })

    await expectConstraintError(
      db.delete(theme).where(sql`${theme.id} = ${createdTheme.id}`),
      "coin_theme_theme_id_theme_id_fk",
      "23503"
    )
  })

  it("cascades Theme Attributions when deleting a coin", async () => {
    const { compositionId, currencyId, distributionId, issuerId } =
      await createCoinDependencies()
    const createdTheme = await createTheme({
      code: "flag",
      name: "Flag",
    })
    const createdCoin = await createCoin({
      title: "Deleted Theme Coin",
      compositionId,
      currencyId,
      distributionId,
      issuerId,
      createdAt: new Date("2026-06-01T12:00:00.000Z"),
    })

    await createCoinTheme({
      coinId: createdCoin.id,
      themeId: createdTheme.id,
    })

    await db.delete(coin).where(eq(coin.id, createdCoin.id))

    await expectCountQueryResult(
      db
        .select({ count: count() })
        .from(coinTheme)
        .where(eq(coinTheme.themeId, createdTheme.id)),
      0
    )
  })
})

describe("orientation schema constraints", () => {
  useTestDatabaseIsolation(db)

  it("rejects orientation codes that are not lowercase slug-style text", async () => {
    await expectConstraintError(
      db.insert(orientation).values({
        code: "Coin Alignment",
        name: "Coin alignment",
      }),
      orientationSchemaNames.codeSlugCheck,
      "23514"
    )
  })

  it("rejects duplicate orientation codes ignoring case", async () => {
    await db.insert(orientation).values({
      code: "coin-alignment",
      name: "Coin alignment",
    })

    await expectConstraintError(
      db.insert(orientation).values({
        code: "COIN-ALIGNMENT",
        name: "Duplicate coin alignment",
      }),
      orientationSchemaNames.codeLowerUniqueIndex,
      "23505"
    )
  })

  it("restricts deleting an orientation while coins still reference it", async () => {
    const { compositionId, currencyId, distributionId, issuerId } =
      await createCoinDependencies()
    const createdOrientation = await createOrientation({
      code: "coin-alignment",
      name: "Coin alignment",
    })

    await createCoin({
      title: "Referenced Orientation Coin",
      compositionId,
      currencyId,
      distributionId,
      issuerId,
      orientationId: createdOrientation.id,
      createdAt: new Date("2026-06-01T12:00:00.000Z"),
    })

    await expectConstraintError(
      db.delete(orientation).where(sql`${orientation.id} = ${createdOrientation.id}`),
      "coin_orientation_id_orientation_id_fk",
      "23503"
    )
  })

  it("keeps shared orientations when deleting a coin", async () => {
    const { compositionId, currencyId, distributionId, issuerId } =
      await createCoinDependencies()
    const createdOrientation = await createOrientation({
      code: "medal-alignment",
      name: "Medal alignment",
    })
    const createdCoin = await createCoin({
      title: "Deleted Orientation Coin",
      compositionId,
      currencyId,
      distributionId,
      issuerId,
      orientationId: createdOrientation.id,
      createdAt: new Date("2026-06-01T12:00:00.000Z"),
    })

    await db.delete(coin).where(eq(coin.id, createdCoin.id))

    await expectCountQueryResult(
      db
        .select({ count: count() })
        .from(orientation)
        .where(eq(orientation.id, createdOrientation.id)),
      1
    )
  })
})

describe("shape schema constraints", () => {
  useTestDatabaseIsolation(db)

  it("rejects shape codes that are not lowercase slug-style text", async () => {
    await expectConstraintError(
      db.insert(shape).values({
        code: "Round Shape",
        name: "Round",
      }),
      shapeSchemaNames.codeSlugCheck,
      "23514"
    )
  })

  it("rejects duplicate shape codes ignoring case", async () => {
    await db.insert(shape).values({
      code: "round",
      name: "Round",
    })

    await expectConstraintError(
      db.insert(shape).values({
        code: "ROUND",
        name: "Duplicate round",
      }),
      shapeSchemaNames.codeLowerUniqueIndex,
      "23505"
    )
  })

  it("restricts deleting a shape while coins still reference it", async () => {
    const { compositionId, currencyId, distributionId, issuerId } =
      await createCoinDependencies()
    const createdShape = await createShape({
      code: "round",
      name: "Round",
    })

    await createCoin({
      title: "Referenced Shape Coin",
      compositionId,
      currencyId,
      distributionId,
      issuerId,
      shapeId: createdShape.id,
      createdAt: new Date("2026-06-01T12:00:00.000Z"),
    })

    await expectConstraintError(
      db.delete(shape).where(sql`${shape.id} = ${createdShape.id}`),
      "coin_shape_id_shape_id_fk",
      "23503"
    )
  })

  it("keeps shared shapes when deleting a coin", async () => {
    const { compositionId, currencyId, distributionId, issuerId } =
      await createCoinDependencies()
    const createdShape = await createShape({
      code: "round",
      name: "Round",
    })
    const createdCoin = await createCoin({
      title: "Deleted Shape Coin",
      compositionId,
      currencyId,
      distributionId,
      issuerId,
      shapeId: createdShape.id,
      createdAt: new Date("2026-06-01T12:00:00.000Z"),
    })

    await db.delete(coin).where(eq(coin.id, createdCoin.id))

    await expectCountQueryResult(
      db
        .select({ count: count() })
        .from(shape)
        .where(eq(shape.id, createdShape.id)),
      1
    )
  })
})

describe("rim schema constraints", () => {
  useTestDatabaseIsolation(db)

  it("rejects rim codes that are not lowercase slug-style text", async () => {
    await expectConstraintError(
      db.insert(rim).values({
        code: "Raised Both Sides",
        name: "Raised, both sides",
      }),
      rimSchemaNames.codeSlugCheck,
      "23514"
    )
  })

  it("rejects duplicate rim codes ignoring case", async () => {
    await db.insert(rim).values({
      code: "raised-both-sides",
      name: "Raised, both sides",
    })

    await expectConstraintError(
      db.insert(rim).values({
        code: "RAISED-BOTH-SIDES",
        name: "Duplicate raised rim",
      }),
      rimSchemaNames.codeLowerUniqueIndex,
      "23505"
    )
  })

  it("restricts deleting a rim while coins still reference it", async () => {
    const { compositionId, currencyId, distributionId, issuerId } =
      await createCoinDependencies()
    const createdRim = await createRim({
      code: "plain",
      name: "Plain",
    })

    await createCoin({
      title: "Referenced Rim Coin",
      compositionId,
      currencyId,
      distributionId,
      issuerId,
      rimId: createdRim.id,
      createdAt: new Date("2026-06-01T12:00:00.000Z"),
    })

    await expectConstraintError(
      db.delete(rim).where(sql`${rim.id} = ${createdRim.id}`),
      "coin_rim_id_rim_id_fk",
      "23503"
    )
  })

  it("keeps shared rims when deleting a coin", async () => {
    const { compositionId, currencyId, distributionId, issuerId } =
      await createCoinDependencies()
    const createdRim = await createRim({
      code: "raised-both-sides",
      name: "Raised, both sides",
    })
    const createdCoin = await createCoin({
      title: "Deleted Rim Coin",
      compositionId,
      currencyId,
      distributionId,
      issuerId,
      rimId: createdRim.id,
      createdAt: new Date("2026-06-01T12:00:00.000Z"),
    })

    await db.delete(coin).where(eq(coin.id, createdCoin.id))

    await expectCountQueryResult(
      db.select({ count: count() }).from(rim).where(eq(rim.id, createdRim.id)),
      1
    )
  })
})

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

  it("stores Demonetization Status as true, false, or null and leaves omitted values unknown", async () => {
    const dependencies = await createCoinDependencies()

    await insertCoinRow({
      ...dependencies,
      title: "Unknown by omission",
    })
    await db.insert(coin).values({
      ...dependencies,
      title: "Known demonetized",
      faceValueText: "1 Test Unit",
      faceValueNumericValue: 1,
      isDemonetized: true,
    })
    await db.insert(coin).values({
      ...dependencies,
      title: "Known not demonetized",
      faceValueText: "1 Test Unit",
      faceValueNumericValue: 1,
      isDemonetized: false,
    })
    await db.insert(coin).values({
      ...dependencies,
      title: "Explicitly unknown",
      faceValueText: "1 Test Unit",
      faceValueNumericValue: 1,
      isDemonetized: null,
    })

    const storedStatuses = await db
      .select({
        title: coin.title,
        isDemonetized: coin.isDemonetized,
      })
      .from(coin)

    expect(storedStatuses).toEqual([
      { title: "Unknown by omission", isDemonetized: null },
      { title: "Known demonetized", isDemonetized: true },
      { title: "Known not demonetized", isDemonetized: false },
      { title: "Explicitly unknown", isDemonetized: null },
    ])
  })

  it("requires every coin to have exactly one direct issuer", async () => {
    const [standardCirculation, silver900, euro] = await Promise.all([
      createDistribution({
        code: "standard-circulation",
        name: "Standard circulation",
      }),
      createComposition({
        code: "silver-900",
        name: "Silver (.900)",
      }),
      createCurrency({
        code: "euro",
        fullName: "Euro (2002-date)",
        name: "Euro",
      }),
    ])

    await expectCoinRequiredColumnError({
      title: "Issuerless Test Coin",
      issuerId: null,
      distributionId: standardCirculation.id,
      compositionId: silver900.id,
      currencyId: euro.id,
      missingColumn: "issuer_id",
    })
  })

  it("requires every coin to have exactly one distribution", async () => {
    const [athens, silver900, euro] = await Promise.all([
      createIssuer({
        code: "athens",
        name: "Athens",
      }),
      createComposition({
        code: "silver-900",
        name: "Silver (.900)",
      }),
      createCurrency({
        code: "euro",
        fullName: "Euro (2002-date)",
        name: "Euro",
      }),
    ])

    await expectCoinRequiredColumnError({
      title: "Distributionless Test Coin",
      issuerId: athens.id,
      distributionId: null,
      compositionId: silver900.id,
      currencyId: euro.id,
      missingColumn: "distribution_id",
    })
  })

  it("requires every coin to have exactly one composition", async () => {
    const [athens, standardCirculation, euro] = await Promise.all([
      createIssuer({
        code: "athens",
        name: "Athens",
      }),
      createDistribution({
        code: "standard-circulation",
        name: "Standard circulation",
      }),
      createCurrency({
        code: "euro",
        fullName: "Euro (2002-date)",
        name: "Euro",
      }),
    ])

    await expectCoinRequiredColumnError({
      title: "Compositionless Test Coin",
      issuerId: athens.id,
      distributionId: standardCirculation.id,
      compositionId: null,
      currencyId: euro.id,
      missingColumn: "composition_id",
    })
  })

  it("requires every coin to have exactly one currency", async () => {
    const [athens, standardCirculation, silver900] = await Promise.all([
      createIssuer({
        code: "athens",
        name: "Athens",
      }),
      createDistribution({
        code: "standard-circulation",
        name: "Standard circulation",
      }),
      createComposition({
        code: "silver-900",
        name: "Silver (.900)",
      }),
    ])

    await expectCoinRequiredColumnError({
      title: "Currencyless Test Coin",
      issuerId: athens.id,
      distributionId: standardCirculation.id,
      compositionId: silver900.id,
      currencyId: null,
      missingColumn: "currency_id",
    })
  })

  it("requires every coin to have face value text", async () => {
    const { compositionId, currencyId, distributionId, issuerId } =
      await createCoinDependencies()

    await expectCoinRequiredColumnError({
      title: "Face Value Textless Test Coin",
      issuerId,
      distributionId,
      compositionId,
      currencyId,
      faceValueText: null,
      missingColumn: "face_value_text",
    })
  })

  it("requires every coin to have a face value numeric value", async () => {
    const { compositionId, currencyId, distributionId, issuerId } =
      await createCoinDependencies()

    await expectCoinRequiredColumnError({
      title: "Face Value Numberless Test Coin",
      issuerId,
      distributionId,
      compositionId,
      currencyId,
      faceValueNumericValue: null,
      missingColumn: "face_value_numeric_value",
    })
  })

  it("allows coins with an unknown issue year range", async () => {
    const { distributionId, issuerId } = await createCoinDependencies()

    await expect(
      createCoin({
        title: "Unknown Issue Year Range Coin",
        issuerId,
        distributionId,
        createdAt: new Date("2026-06-01T00:00:00.000Z"),
      })
    ).resolves.toBeDefined()
  })

  it("allows coins with a closed issue year range, including astronomical integer years", async () => {
    const { distributionId, issuerId } = await createCoinDependencies()

    await expect(
      createCoin({
        title: "Single Year Range Coin",
        issuerId,
        distributionId,
        minYear: 1900,
        maxYear: 1900,
        createdAt: new Date("2026-06-02T00:00:00.000Z"),
      })
    ).resolves.toBeDefined()
  })

  it("allows negative and zero astronomical issue years when the range is otherwise valid", async () => {
    const { distributionId, issuerId } = await createCoinDependencies()

    await expect(
      createCoin({
        title: "Astronomical Year Range Coin",
        issuerId,
        distributionId,
        minYear: -1,
        maxYear: 0,
        createdAt: new Date("2026-06-02T12:00:00.000Z"),
      })
    ).resolves.toBeDefined()
  })

  it("allows optional positive catalogue measurements", async () => {
    const { distributionId, issuerId } = await createCoinDependencies()

    await expect(
      createCoin({
        title: "Measured Coin",
        issuerId,
        distributionId,
        weight: 4.5,
        diameter: 19.25,
        thickness: 1.75,
        createdAt: new Date("2026-06-02T18:00:00.000Z"),
      })
    ).resolves.toBeDefined()
  })

  it("allows coins with unknown or positive whole-number mintage", async () => {
    const { distributionId, issuerId } = await createCoinDependencies()

    await expect(
      createCoin({
        title: "Unknown Mintage Coin",
        issuerId,
        distributionId,
        createdAt: new Date("2026-06-02T20:00:00.000Z"),
      })
    ).resolves.toBeDefined()

    await expect(
      createCoin({
        title: "Known Mintage Coin",
        issuerId,
        distributionId,
        mintage: 1234567,
        createdAt: new Date("2026-06-02T21:00:00.000Z"),
      })
    ).resolves.toBeDefined()
  })

  it("rejects coins with only min_year present", async () => {
    const { compositionId, currencyId, distributionId, issuerId } =
      await createCoinDependencies()

    await expectConstraintError(
      insertCoinRow({
        compositionId,
        title: "Half Entered Range Coin",
        issuerId,
        distributionId,
        minYear: 1900,
        currencyId,
      }),
      coinSchemaNames.issueYearRangeClosedCheck,
      "23514"
    )
  })

  it("rejects coins with only max_year present", async () => {
    const { compositionId, currencyId, distributionId, issuerId } =
      await createCoinDependencies()

    await expectConstraintError(
      insertCoinRow({
        compositionId,
        title: "Half Entered Max Range Coin",
        issuerId,
        distributionId,
        maxYear: 1900,
        currencyId,
      }),
      coinSchemaNames.issueYearRangeClosedCheck,
      "23514"
    )
  })

  it("rejects coins whose issue year range runs backwards", async () => {
    const { distributionId, issuerId } = await createCoinDependencies()

    await expectConstraintError(
      createCoin({
        title: "Backwards Range Coin",
        issuerId,
        distributionId,
        minYear: 1901,
        maxYear: 1900,
        createdAt: new Date("2026-06-03T00:00:00.000Z"),
      }),
      coinSchemaNames.issueYearRangeOrderCheck,
      "23514"
    )
  })

  it("rejects non-whole mintage values", async () => {
    const { compositionId, currencyId, distributionId, issuerId } =
      await createCoinDependencies()

    await expect(
      insertCoinRow({
        compositionId,
        currencyId,
        distributionId,
        issuerId,
        mintage: 1.5,
        title: "Fractional Mintage Coin",
      })
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "22P02",
      }),
    })
  })

  it.each([
    [
      "faceValueNumericValue",
      0,
      coinSchemaNames.faceValueNumericValuePositiveCheck,
    ],
    [
      "faceValueNumericValue",
      -0.01,
      coinSchemaNames.faceValueNumericValuePositiveCheck,
    ],
    ["weight", 0, coinSchemaNames.weightPositiveCheck],
    ["weight", -0.01, coinSchemaNames.weightPositiveCheck],
    ["diameter", 0, coinSchemaNames.diameterPositiveCheck],
    ["diameter", -1, coinSchemaNames.diameterPositiveCheck],
    ["thickness", 0, coinSchemaNames.thicknessPositiveCheck],
    ["thickness", -0.5, coinSchemaNames.thicknessPositiveCheck],
    ["mintage", 0, coinSchemaNames.mintagePositiveCheck],
    ["mintage", -1, coinSchemaNames.mintagePositiveCheck],
  ] as const)(
    "rejects non-positive %s values",
    async (field, value, constraintName) => {
      const { distributionId, issuerId } = await createCoinDependencies()

      await expectConstraintError(
        createCoin({
          title: `Invalid ${field} Coin ${value}`,
          issuerId,
          distributionId,
          [field]: value,
          createdAt: new Date("2026-06-03T12:00:00.000Z"),
        }),
        constraintName,
        "23514"
      )
    }
  )
})

describe("distribution schema constraints", () => {
  useTestDatabaseIsolation(db)

  it("rejects duplicate distribution codes ignoring case", async () => {
    await createDistribution({
      code: "standard-circulation",
      name: "Standard circulation",
    })

    await expectConstraintError(
      db.insert(distribution).values({
        code: "standard-circulation",
        name: "Duplicate Standard circulation",
      }),
      distributionSchemaNames.codeLowerUniqueIndex,
      "23505"
    )
  })

  it("rejects deleting a distribution while a coin still references it", async () => {
    const athens = await createIssuer({
      code: "athens",
      name: "Athens",
    })
    const standardCirculation = await createDistribution({
      code: "standard-circulation",
      name: "Standard circulation",
    })

    await createCoin({
      title: "Distribution Restrict Delete Coin",
      issuerId: athens.id,
      distributionId: standardCirculation.id,
      createdAt: new Date("2026-05-31T00:00:00.000Z"),
    })

    await expectConstraintError(
      db
        .delete(distribution)
        .where(sql`${distribution.id} = ${standardCirculation.id}`),
      "coin_distribution_id_distribution_id_fk",
      "23001"
    )
  })
})

describe("coin face schema constraints", () => {
  useTestDatabaseIsolation(db)

  it("allows at most one Obverse and at most one Reverse per coin", async () => {
    const { compositionId, currencyId, distributionId, issuerId } =
      await createCoinDependencies()
    const createdCoin = await createCoin({
      title: "Single Face Per Side Coin",
      compositionId,
      currencyId,
      distributionId,
      issuerId,
      createdAt: new Date("2026-06-01T12:00:00.000Z"),
    })

    await createCoinFace({
      coinId: createdCoin.id,
      side: "obverse",
      description: "First obverse description.",
    })
    await createCoinFace({
      coinId: createdCoin.id,
      side: "reverse",
      lettering: "FIRST REVERSE",
    })

    await expectConstraintError(
      createCoinFace({
        coinId: createdCoin.id,
        side: "obverse",
        description: "Duplicate obverse description.",
      }),
      coinFaceSchemaNames.sideUniqueIndex,
      "23505"
    )
  })

  it("rejects face side values outside obverse and reverse", async () => {
    const { compositionId, currencyId, distributionId, issuerId } =
      await createCoinDependencies()
    const createdCoin = await createCoin({
      title: "Invalid Face Side Coin",
      compositionId,
      currencyId,
      distributionId,
      issuerId,
      createdAt: new Date("2026-06-01T12:00:00.000Z"),
    })

    await expectConstraintError(
      db.execute(sql`
        insert into "coin_face" ("coin_id", "side")
        values (${createdCoin.id}, ${"edge"})
      `),
      coinFaceSchemaNames.sideCheck,
      "23514"
    )
  })

  it("cascades face detail rows when deleting a coin", async () => {
    const { compositionId, currencyId, distributionId, issuerId } =
      await createCoinDependencies()
    const createdCoin = await createCoin({
      title: "Deleted Face Detail Coin",
      compositionId,
      currencyId,
      distributionId,
      issuerId,
      createdAt: new Date("2026-06-01T12:00:00.000Z"),
    })

    await createCoinFace({
      coinId: createdCoin.id,
      side: "obverse",
      description: "Portrait right.",
    })
    await createCoinFace({
      coinId: createdCoin.id,
      side: "reverse",
      lettering: "ONE EURO",
    })

    await db.delete(coin).where(eq(coin.id, createdCoin.id))

    await expectCountQueryResult(
      db
        .select({ count: count() })
        .from(coinFace)
        .where(eq(coinFace.coinId, createdCoin.id)),
      0
    )
  })
})

describe("engraver schema constraints", () => {
  useTestDatabaseIsolation(db)

  it("rejects engraver codes that are not lowercase slug-style text", async () => {
    await expectConstraintError(
      db.insert(engraver).values({
        code: "Georgios Stamatopoulos",
        name: "Georgios Stamatopoulos",
      }),
      engraverSchemaNames.codeSlugCheck,
      "23514"
    )
  })

  it("rejects duplicate engraver codes ignoring case", async () => {
    await db.insert(engraver).values({
      code: "georgios-stamatopoulos",
      name: "Georgios Stamatópoulos",
    })

    await expectConstraintError(
      db.insert(engraver).values({
        code: "GEORGIOS-STAMATOPOULOS",
        name: "Duplicate Geórgios Stamatópoulos",
      }),
      engraverSchemaNames.codeLowerUniqueIndex,
      "23505"
    )
  })

  it("allows duplicate Engraver display names when the codes differ", async () => {
    await expect(
      db.insert(engraver).values([
        {
          code: "georgios-stamatopoulos",
          name: "Georgios Stamatópoulos",
        },
        {
          code: "georgios-stamatopoulos-ii",
          name: "Georgios Stamatópoulos",
        },
      ])
    ).resolves.toBeDefined()
  })

  it("restricts deleting an Engraver while face attributions still reference it", async () => {
    const { compositionId, currencyId, distributionId, issuerId } =
      await createCoinDependencies()
    const createdCoin = await createCoin({
      title: "Referenced Engraver Coin",
      compositionId,
      currencyId,
      distributionId,
      issuerId,
      createdAt: new Date("2026-06-01T12:00:00.000Z"),
    })
    const createdFace = await createCoinFace({
      coinId: createdCoin.id,
      side: "obverse",
      description: "Portrait left.",
    })
    const createdEngraver = await createEngraver({
      code: "georgios-stamatopoulos",
      name: "Georgios Stamatópoulos",
    })

    await createCoinFaceEngraver({
      coinFaceId: createdFace.id,
      engraverId: createdEngraver.id,
    })

    await expectConstraintError(
      db.delete(engraver).where(sql`${engraver.id} = ${createdEngraver.id}`),
      "coin_face_engraver_engraver_id_engraver_id_fk",
      "23001"
    )
  })
})

describe("coin face engraver schema constraints", () => {
  useTestDatabaseIsolation(db)

  it("cascades face engraver attributions when deleting a face", async () => {
    const { compositionId, currencyId, distributionId, issuerId } =
      await createCoinDependencies()
    const createdCoin = await createCoin({
      title: "Deleted Face Attribution Coin",
      compositionId,
      currencyId,
      distributionId,
      issuerId,
      createdAt: new Date("2026-06-01T12:00:00.000Z"),
    })
    const createdFace = await createCoinFace({
      coinId: createdCoin.id,
      side: "reverse",
      lettering: "2 EURO",
    })
    const createdEngraver = await createEngraver({
      code: "georgios-stamatopoulos",
      name: "Georgios Stamatópoulos",
    })

    await createCoinFaceEngraver({
      coinFaceId: createdFace.id,
      engraverId: createdEngraver.id,
    })

    await db.delete(coinFace).where(eq(coinFace.id, createdFace.id))

    await expectCountQueryResult(
      db
        .select({ count: count() })
        .from(coinFaceEngraver)
        .where(eq(coinFaceEngraver.coinFaceId, createdFace.id)),
      0
    )
  })

  it("rejects duplicate face engraver attributions", async () => {
    const { compositionId, currencyId, distributionId, issuerId } =
      await createCoinDependencies()
    const createdCoin = await createCoin({
      title: "Duplicate Face Attribution Coin",
      compositionId,
      currencyId,
      distributionId,
      issuerId,
      createdAt: new Date("2026-06-01T12:00:00.000Z"),
    })
    const createdFace = await createCoinFace({
      coinId: createdCoin.id,
      side: "obverse",
      description: "Portrait right.",
    })
    const createdEngraver = await createEngraver({
      code: "georgios-stamatopoulos",
      name: "Georgios Stamatópoulos",
    })

    await createCoinFaceEngraver({
      coinFaceId: createdFace.id,
      engraverId: createdEngraver.id,
    })

    await expectConstraintError(
      createCoinFaceEngraver({
        coinFaceId: createdFace.id,
        engraverId: createdEngraver.id,
      }),
      "coin_face_engraver_coin_face_id_engraver_id_pk",
      "23505"
    )
  })
})

describe("catalogue schema constraints", () => {
  useTestDatabaseIsolation(db)

  it("requires catalogue codes", async () => {
    await expect(
      db.execute(sql`
        insert into "catalogue" ("code", "title")
        values (${null}, ${"Standard Catalog of World Coins"})
      `)
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23502",
        column_name: "code",
      }),
    })
  })

  it("rejects duplicate catalogue codes ignoring case", async () => {
    await createCatalogue({
      code: "KM",
      title: "Standard Catalog of World Coins",
    })

    await expectConstraintError(
      db.insert(catalogue).values({
        code: "km",
        title: "Duplicate Standard Catalog of World Coins",
      }),
      catalogueSchemaNames.codeLowerUniqueIndex,
      "23505"
    )
  })

  it("allows duplicate catalogue titles", async () => {
    await expect(
      db.insert(catalogue).values([
        {
          code: "KM",
          title: "Shared Title",
        },
        {
          code: "RIC",
          title: "Shared Title",
        },
      ])
    ).resolves.toBeDefined()
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
      "23001"
    )
  })
})

describe("coin ruler schema constraints", () => {
  useTestDatabaseIsolation(db)

  it("requires ruler attribution order", async () => {
    const athens = await createIssuer({
      code: "athens",
      name: "Athens",
    })
    const civicCoin = await createCoin({
      title: "Civic Fraction",
      issuerId: athens.id,
      createdAt: new Date("2026-05-31T00:00:00.000Z"),
    })
    const liberty = await createRuler({
      code: "liberty",
      name: "Liberty",
    })

    await expect(
      db.execute(sql`
        insert into "coin_ruler" ("coin_id", "ruler_id", "ruler_order")
        values (${civicCoin.id}, ${liberty.id}, ${null})
      `)
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        code: "23502",
        column_name: "ruler_order",
      }),
    })
  })

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

  it("allows the same ruler to use different attribution orders on different coins", async () => {
    const athens = await createIssuer({
      code: "athens",
      name: "Athens",
    })
    const civicFirstCoin = await createCoin({
      title: "Civic Stater",
      issuerId: athens.id,
      createdAt: new Date("2026-06-03T00:00:00.000Z"),
    })
    const civicSecondCoin = await createCoin({
      title: "Civic Obol",
      issuerId: athens.id,
      createdAt: new Date("2026-06-03T12:00:00.000Z"),
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
      coinId: civicFirstCoin.id,
      rulerId: liberty.id,
      rulerOrder: 1,
    })
    await createCoinRuler({
      coinId: civicSecondCoin.id,
      rulerId: athena.id,
      rulerOrder: 1,
    })

    await expect(
      createCoinRuler({
        coinId: civicSecondCoin.id,
        rulerId: liberty.id,
        rulerOrder: 2,
      })
    ).resolves.toMatchObject({
      coinId: civicSecondCoin.id,
      rulerId: liberty.id,
      rulerOrder: 2,
    })
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
      "23001"
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

describe("coin mint schema constraints", () => {
  useTestDatabaseIsolation(db)

  it("rejects duplicate mint attributions for the same coin", async () => {
    const { compositionId, currencyId, distributionId, issuerId } =
      await createCoinDependencies()
    const createdMint = await createMint({
      code: "royal-mint-of-madrid",
      name: "Royal Mint of Madrid",
    })
    const createdCoin = await createCoin({
      title: "Duplicate Mint Attribution Coin",
      compositionId,
      currencyId,
      distributionId,
      issuerId,
      createdAt: new Date("2026-06-01T12:00:00.000Z"),
    })

    await createCoinMint({
      coinId: createdCoin.id,
      mintId: createdMint.id,
    })

    await expectConstraintError(
      db.insert(coinMint).values({
        coinId: createdCoin.id,
        mintId: createdMint.id,
      }),
      coinMintSchemaNames.coinIdMintIdPrimaryKey,
      "23505"
    )
  })

  it("deletes coin mint attributions when deleting a coin", async () => {
    const { compositionId, currencyId, distributionId, issuerId } =
      await createCoinDependencies()
    const createdMint = await createMint({
      code: "royal-mint-of-madrid",
      name: "Royal Mint of Madrid",
    })
    const createdCoin = await createCoin({
      title: "Cascade Deleted Mint Attribution Coin",
      compositionId,
      currencyId,
      distributionId,
      issuerId,
      createdAt: new Date("2026-06-01T12:00:00.000Z"),
    })

    await createCoinMint({
      coinId: createdCoin.id,
      mintId: createdMint.id,
    })

    await db.delete(coin).where(eq(coin.id, createdCoin.id))

    await expectCountQueryResult(
      db
        .select({ count: count() })
        .from(coinMint)
        .where(eq(coinMint.mintId, createdMint.id)),
      0
    )
  })
})

describe("coin reference schema constraints", () => {
  useTestDatabaseIsolation(db)

  it("rejects equivalent duplicate catalogue references on the same coin", async () => {
    const athens = await createIssuer({
      code: "athens",
      name: "Athens",
    })
    const km = await createCatalogue({
      code: "KM",
      title: "Standard Catalog of World Coins",
    })
    const civicCoin = await createCoin({
      title: "Catalogue Duplicate Test Coin",
      issuerId: athens.id,
      createdAt: new Date("2026-06-06T00:00:00.000Z"),
    })

    await createCoinReference({
      coinId: civicCoin.id,
      catalogueId: km.id,
      number: "1338 A",
    })

    await expectConstraintError(
      db.insert(coinReference).values({
        coinId: civicCoin.id,
        catalogueId: km.id,
        number: " 1338   a ",
      }),
      "coin_reference_coin_id_catalogue_id_normalized_number_unique_id",
      "23505"
    )
  })

  it("allows the same catalogue reference number on different coins", async () => {
    const athens = await createIssuer({
      code: "athens",
      name: "Athens",
    })
    const km = await createCatalogue({
      code: "KM",
      title: "Standard Catalog of World Coins",
    })
    const firstCoin = await createCoin({
      title: "First Shared Reference Coin",
      issuerId: athens.id,
      createdAt: new Date("2026-06-07T00:00:00.000Z"),
    })
    const secondCoin = await createCoin({
      title: "Second Shared Reference Coin",
      issuerId: athens.id,
      createdAt: new Date("2026-06-08T00:00:00.000Z"),
    })

    await createCoinReference({
      coinId: firstCoin.id,
      catalogueId: km.id,
      number: "1338",
    })

    await expect(
      createCoinReference({
        coinId: secondCoin.id,
        catalogueId: km.id,
        number: "1338",
      })
    ).resolves.toMatchObject({
      coinId: secondCoin.id,
      catalogueId: km.id,
      number: "1338",
    })
  })

  it("allows multiple distinct references from the same catalogue on one coin", async () => {
    const athens = await createIssuer({
      code: "athens",
      name: "Athens",
    })
    const km = await createCatalogue({
      code: "KM",
      title: "Standard Catalog of World Coins",
    })
    const civicCoin = await createCoin({
      title: "Multiple Catalogue Reference Coin",
      issuerId: athens.id,
      createdAt: new Date("2026-06-09T00:00:00.000Z"),
    })

    await createCoinReference({
      coinId: civicCoin.id,
      catalogueId: km.id,
      number: "1338",
    })

    await expect(
      createCoinReference({
        coinId: civicCoin.id,
        catalogueId: km.id,
        number: "1338A",
      })
    ).resolves.toMatchObject({
      coinId: civicCoin.id,
      catalogueId: km.id,
      number: "1338A",
    })
  })

  it("restricts deleting a catalogue while a coin reference still uses it", async () => {
    const athens = await createIssuer({
      code: "athens",
      name: "Athens",
    })
    const km = await createCatalogue({
      code: "KM",
      title: "Standard Catalog of World Coins",
    })
    const civicCoin = await createCoin({
      title: "Catalogue Restrict Delete Coin",
      issuerId: athens.id,
      createdAt: new Date("2026-06-10T00:00:00.000Z"),
    })

    await createCoinReference({
      coinId: civicCoin.id,
      catalogueId: km.id,
      number: "1338",
    })

    await expectConstraintError(
      db.delete(catalogue).where(sql`${catalogue.id} = ${km.id}`),
      "coin_reference_catalogue_id_catalogue_id_fk",
      "23001"
    )
  })

  it("deletes coin references when the coin is deleted", async () => {
    const athens = await createIssuer({
      code: "athens",
      name: "Athens",
    })
    const km = await createCatalogue({
      code: "KM",
      title: "Standard Catalog of World Coins",
    })
    const civicCoin = await createCoin({
      title: "Catalogue Cascade Delete Coin",
      issuerId: athens.id,
      createdAt: new Date("2026-06-11T00:00:00.000Z"),
    })

    await createCoinReference({
      coinId: civicCoin.id,
      catalogueId: km.id,
      number: "1338",
    })

    await db.delete(coin).where(sql`${coin.id} = ${civicCoin.id}`)

    await expect(
      db
        .select()
        .from(coinReference)
        .where(sql`${coinReference.coinId} = ${civicCoin.id}`)
    ).resolves.toStrictEqual([])
  })
})
