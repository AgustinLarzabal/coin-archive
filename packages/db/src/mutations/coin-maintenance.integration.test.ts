import { count, eq } from "drizzle-orm"
import { describe, expect, it } from "vitest"

import { db } from "../index"
import { coin } from "../schema/coin"
import { coinReference } from "../schema/coin-reference"
import { coinRuler } from "../schema/coin-ruler"
import { coinSurface } from "../schema/coin-surface"
import { coinSurfaceEngraver } from "../schema/coin-surface-engraver"
import {
  createCatalogue,
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
  createShape,
  createTechnique,
  createTheme,
} from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"
import {
  createCoinMaintenance,
  createCoinMaintenanceIdempotently,
  createCoinMaintenanceIdempotentlyWithDatabase,
  releaseCoinMaintenanceCreateWithDatabase,
  replaceCoinMaintenanceWithDatabase,
  reserveCoinMaintenanceCreateWithDatabase,
  deleteCoinMaintenance,
  updateCoinMaintenance,
} from "./coin-maintenance"
import { getCoinMaintenanceRecord } from "../queries/get-coin-maintenance-record"

describe("coin maintenance mutations integration", () => {
  useTestDatabaseIsolation(db)

  it("atomically version-guards complete replacements, including child-only changes", async () => {
    const issuer = await createIssuer({
      code: "versioned-coin-issuer",
      name: "Versioned Coin Issuer",
    })
    const firstRuler = await createRuler({
      code: "versioned-coin-first-ruler",
      name: "First Ruler",
    })
    const secondRuler = await createRuler({
      code: "versioned-coin-second-ruler",
      name: "Second Ruler",
    })
    const distribution = await createDistribution({
      code: "versioned-coin-distribution",
      name: "Versioned Distribution",
    })
    const composition = await createComposition({
      code: "versioned-coin-composition",
      name: "Versioned Composition",
    })
    const currency = await createCurrency({
      code: "versioned-coin-currency",
      name: "VC",
      fullName: "Versioned Currency",
    })
    const fields = {
      comments: null,
      compositionDescription: null,
      compositionId: composition.id,
      currencyId: currency.id,
      diameter: null,
      distributionId: distribution.id,
      edgeId: null,
      faceValueNumericValue: 1,
      faceValueText: "1 Unit",
      isDemonetized: null,
      issuerId: issuer.id,
      maxYear: null,
      mintIds: [],
      minYear: null,
      mintage: null,
      orientationId: null,
      references: [],
      rimId: null,
      rulerIds: [firstRuler.id],
      shapeId: null,
      surfaces: { obverse: null, reverse: null, edge: null },
      techniqueId: null,
      themeIds: [],
      thickness: null,
      title: "Versioned Coin",
      weight: null,
    }
    const created = await createCoinMaintenance(fields)

    await expect(
      replaceCoinMaintenanceWithDatabase(db, {
        id: created.id,
        expectedVersion: 1,
        fields: { ...fields, rulerIds: [secondRuler.id] },
      })
    ).resolves.toMatchObject({ status: "updated", coin: { version: 2 } })
    const competing = await Promise.all([
      replaceCoinMaintenanceWithDatabase(db, {
        id: created.id,
        expectedVersion: 2,
        fields: {
          ...fields,
          rulerIds: [secondRuler.id],
          title: "First competing edit",
        },
      }),
      replaceCoinMaintenanceWithDatabase(db, {
        id: created.id,
        expectedVersion: 2,
        fields: {
          ...fields,
          rulerIds: [secondRuler.id],
          title: "Second competing edit",
        },
      }),
    ])
    expect(competing.map(({ status }) => status).sort()).toStrictEqual([
      "stale",
      "updated",
    ])
    await expect(
      replaceCoinMaintenanceWithDatabase(db, {
        id: created.id,
        expectedVersion: 2,
        fields: { ...fields, title: "Stale overwrite" },
      })
    ).resolves.toStrictEqual({ status: "stale" })
    await expect(getCoinMaintenanceRecord(created.id)).resolves.toMatchObject({
      title: expect.stringMatching(/competing edit$/),
      rulerIds: [secondRuler.id],
      version: 3,
    })
  })

  it("creates a Coin with the required core fields and optional scalar fields atomically", async () => {
    const issuer = await createIssuer({
      code: "coin-maintenance-create-issuer",
      name: "Coin Maintenance Create Issuer",
    })
    const ruler = await createRuler({
      code: "coin-maintenance-create-ruler",
      name: "Coin Maintenance Create Ruler",
    })
    const distribution = await createDistribution({
      code: "coin-maintenance-create-distribution",
      name: "Coin Maintenance Create Distribution",
    })
    const composition = await createComposition({
      code: "coin-maintenance-create-composition",
      name: "Coin Maintenance Create Composition",
    })
    const currency = await createCurrency({
      code: "coin-maintenance-create-currency",
      name: "CMC",
      fullName: "Coin Maintenance Create Currency",
    })
    const orientation = await createOrientation({
      code: "coin-maintenance-create-orientation",
      name: "Coin Maintenance Create Orientation",
    })
    const shape = await createShape({
      code: "coin-maintenance-create-shape",
      name: "Coin Maintenance Create Shape",
    })
    const technique = await createTechnique({
      code: "coin-maintenance-create-technique",
      name: "Coin Maintenance Create Technique",
    })
    const edge = await createEdge({
      code: "coin-maintenance-create-edge",
      name: "Coin Maintenance Create Edge",
    })
    const rim = await createRim({
      code: "coin-maintenance-create-rim",
      name: "Coin Maintenance Create Rim",
    })

    const createdCoin = await createCoinMaintenance({
      comments: "  Public note.  ",
      compositionDescription: "  Silver outer ring with a brass core.  ",
      compositionId: composition.id,
      currencyId: currency.id,
      diameter: 22.5,
      distributionId: distribution.id,
      edgeId: edge.id,
      faceValueNumericValue: 2,
      faceValueText: "  2 Test Units  ",
      isDemonetized: null,
      issuerId: issuer.id,
      maxYear: 2001,
      minYear: 1999,
      mintIds: [],
      mintage: 1500,
      orientationId: orientation.id,
      rimId: rim.id,
      rulerIds: [ruler.id],
      shapeId: shape.id,
      techniqueId: technique.id,
      themeIds: [],
      thickness: 1.8,
      title: "  Coin Maintenance Create Coin  ",
      weight: 7.5,
    })

    expect(createdCoin).toMatchObject({
      version: 1,
      title: "Coin Maintenance Create Coin",
      comments: "Public note.",
      compositionDescription: "Silver outer ring with a brass core.",
      faceValueText: "2 Test Units",
      issuerId: issuer.id,
      distributionId: distribution.id,
      compositionId: composition.id,
      currencyId: currency.id,
      orientationId: orientation.id,
      shapeId: shape.id,
      techniqueId: technique.id,
      edgeId: edge.id,
      rimId: rim.id,
      minYear: 1999,
      maxYear: 2001,
      weight: 7.5,
      diameter: 22.5,
      thickness: 1.8,
      mintage: 1500,
      isDemonetized: null,
    })

    await expect(
      db.query.coinRuler.findMany({
        where: (record, { eq }) => eq(record.coinId, createdCoin.id),
        orderBy: (record, { asc }) => asc(record.rulerOrder),
      })
    ).resolves.toStrictEqual([
      {
        coinId: createdCoin.id,
        rulerId: ruler.id,
        rulerOrder: 1,
      },
    ])

    await expect(
      getCoinMaintenanceRecord(createdCoin.id)
    ).resolves.toMatchObject({
      compositionDescription: "Silver outer ring with a brass core.",
    })
  })

  it("persists and replays one complete Coin aggregate for an idempotency key", async () => {
    const issuer = await createIssuer({
      code: "idempotent-coin-issuer",
      name: "Issuer",
    })
    const ruler = await createRuler({
      code: "idempotent-coin-ruler",
      name: "Ruler",
    })
    const distribution = await createDistribution({
      code: "idempotent-coin-distribution",
      name: "Distribution",
    })
    const composition = await createComposition({
      code: "idempotent-coin-composition",
      name: "Composition",
    })
    const currency = await createCurrency({
      code: "idempotent-coin-currency",
      name: "IC",
      fullName: "Currency",
    })
    const mint = await createMint({
      code: "idempotent-coin-mint",
      name: "Mint",
    })
    const theme = await createTheme({
      code: "idempotent-coin-theme",
      name: "Theme",
    })
    const catalogue = await createCatalogue({
      code: "IDEM",
      title: "Idempotent Catalogue",
    })
    const engraver = await createEngraver({
      code: "idempotent-coin-engraver",
      name: "Engraver",
    })
    const fields = {
      title: "Idempotent Coin",
      comments: null,
      compositionDescription: null,
      compositionId: composition.id,
      currencyId: currency.id,
      diameter: null,
      distributionId: distribution.id,
      edgeId: null,
      faceValueNumericValue: 1,
      faceValueText: "1 Unit",
      isDemonetized: null,
      issuerId: issuer.id,
      maxYear: null,
      mintIds: [mint.id],
      minYear: null,
      mintage: null,
      orientationId: null,
      references: [{ catalogueId: catalogue.id, number: "42" }],
      rimId: null,
      rulerIds: [ruler.id],
      shapeId: null,
      surfaces: {
        obverse: {
          description: "Portrait",
          lettering: "UNIT",
          imageUrl: "https://images.example.test/obverse.webp",
          engraverIds: [engraver.id],
        },
        reverse: null,
        edge: {
          description: "Reeded",
          lettering: null,
          imageUrl: null,
        },
      },
      techniqueId: null,
      themeIds: [theme.id],
      thickness: null,
      weight: null,
    }
    const request = {
      collectorId: "collector-1",
      idempotencyKey: "coin-attempt-1",
      requestHash: "a".repeat(64),
      expiresAt: new Date("2030-08-03T00:00:00.000Z"),
    }
    const first = await createCoinMaintenanceIdempotentlyWithDatabase(db, {
      ...request,
      fields,
    })
    const retry = await createCoinMaintenanceIdempotentlyWithDatabase(db, {
      ...request,
      fields: { ...fields, title: "Ignored on replay" },
    })
    const mismatch = await createCoinMaintenanceIdempotently({
      ...request,
      requestHash: "b".repeat(64),
      fields: { ...fields, title: "Different Coin" },
    })

    expect(first).toMatchObject({
      status: "created",
      coin: { title: "Idempotent Coin" },
    })
    expect(retry).toStrictEqual({
      status: "replayed",
      coin: first.status === "created" ? first.coin : expect.anything(),
    })
    expect(mismatch).toStrictEqual({ status: "mismatch" })
    await expect(
      reserveCoinMaintenanceCreateWithDatabase(db, request)
    ).resolves.toMatchObject({
      status: "replayed",
      coin: first.status === "created" ? first.coin : expect.anything(),
    })
    await expect(db.query.coin.findMany()).resolves.toHaveLength(1)
    await expect(db.query.coinRuler.findMany()).resolves.toHaveLength(1)
    await expect(db.query.coinMint.findMany()).resolves.toHaveLength(1)
    await expect(db.query.coinTheme.findMany()).resolves.toHaveLength(1)
    await expect(db.query.coinReference.findMany()).resolves.toHaveLength(1)
    await expect(db.query.coinSurface.findMany()).resolves.toHaveLength(2)
    await expect(db.query.coinSurfaceEngraver.findMany()).resolves.toHaveLength(
      1
    )

    const pending = { ...request, idempotencyKey: "pending-attempt" }
    await expect(
      reserveCoinMaintenanceCreateWithDatabase(db, pending)
    ).resolves.toStrictEqual({ status: "reserved" })
    await expect(
      reserveCoinMaintenanceCreateWithDatabase(db, {
        ...pending,
        requestHash: "b".repeat(64),
      })
    ).resolves.toStrictEqual({ status: "mismatch" })
    await releaseCoinMaintenanceCreateWithDatabase(db, pending)
  })

  it("stores blank Composition Description as null", async () => {
    const issuer = await createIssuer({
      code: "coin-maintenance-blank-description-issuer",
      name: "Coin Maintenance Blank Description Issuer",
    })
    const ruler = await createRuler({
      code: "coin-maintenance-blank-description-ruler",
      name: "Coin Maintenance Blank Description Ruler",
    })
    const distribution = await createDistribution({
      code: "coin-maintenance-blank-description-distribution",
      name: "Coin Maintenance Blank Description Distribution",
    })
    const composition = await createComposition({
      code: "coin-maintenance-blank-description-composition",
      name: "Coin Maintenance Blank Description Composition",
    })
    const currency = await createCurrency({
      code: "coin-maintenance-blank-description-currency",
      name: "CMBD",
      fullName: "Coin Maintenance Blank Description Currency",
    })

    const createdCoin = await createCoinMaintenance({
      comments: null,
      compositionDescription: "   ",
      compositionId: composition.id,
      currencyId: currency.id,
      diameter: null,
      distributionId: distribution.id,
      edgeId: null,
      faceValueNumericValue: 1,
      faceValueText: "1 Unit",
      isDemonetized: null,
      issuerId: issuer.id,
      maxYear: null,
      minYear: null,
      mintIds: [],
      mintage: null,
      orientationId: null,
      rimId: null,
      rulerIds: [ruler.id],
      shapeId: null,
      techniqueId: null,
      themeIds: [],
      thickness: null,
      title: "Coin Maintenance Blank Description Coin",
      weight: null,
    })

    expect(createdCoin.compositionDescription).toBeNull()
  })

  it("rolls back failed aggregate creates and leaves no partial Coin or owned child rows", async () => {
    const issuer = await createIssuer({
      code: "coin-maintenance-create-rollback-issuer",
      name: "Coin Maintenance Create Rollback Issuer",
    })
    const distribution = await createDistribution({
      code: "coin-maintenance-create-rollback-distribution",
      name: "Coin Maintenance Create Rollback Distribution",
    })
    const composition = await createComposition({
      code: "coin-maintenance-create-rollback-composition",
      name: "Coin Maintenance Create Rollback Composition",
    })
    const currency = await createCurrency({
      code: "coin-maintenance-create-rollback-currency",
      name: "CMCR",
      fullName: "Coin Maintenance Create Rollback Currency",
    })
    const ruler = await createRuler({
      code: "coin-maintenance-create-rollback-ruler",
      name: "Coin Maintenance Create Rollback Ruler",
    })

    await expect(
      createCoinMaintenance({
        comments: null,
        compositionDescription: null,
        compositionId: composition.id,
        currencyId: currency.id,
        diameter: null,
        distributionId: distribution.id,
        edgeId: null,
        faceValueNumericValue: 1,
        faceValueText: "1 Unit",
        isDemonetized: null,
        issuerId: issuer.id,
        maxYear: null,
        mintIds: [],
        minYear: null,
        mintage: null,
        orientationId: null,
        references: [],
        rimId: null,
        rulerIds: [ruler.id],
        shapeId: null,
        surfaces: {
          obverse: {
            description: "Broken obverse",
            lettering: null,
            imageUrl: null,
            engraverIds: ["00000000-0000-0000-0000-000000000000"],
          },
          reverse: null,
          edge: null,
        },
        techniqueId: null,
        themeIds: [],
        thickness: null,
        title: "Coin Maintenance Failed Create Coin",
        weight: null,
      })
    ).rejects.toThrow()

    await expect(
      db.select({ count: count() }).from(coin)
    ).resolves.toStrictEqual([{ count: 0 }])
    await expect(
      db.select({ count: count() }).from(coinRuler)
    ).resolves.toStrictEqual([{ count: 0 }])
    await expect(
      db.select({ count: count() }).from(coinSurface)
    ).resolves.toStrictEqual([{ count: 0 }])
    await expect(
      db.select({ count: count() }).from(coinSurfaceEngraver)
    ).resolves.toStrictEqual([{ count: 0 }])
  })

  it("updates the Coin core fields and replaces attribution collections atomically under last-write-wins semantics", async () => {
    const issuer = await createIssuer({
      code: "coin-maintenance-update-issuer",
      name: "Coin Maintenance Update Issuer",
    })
    const distribution = await createDistribution({
      code: "coin-maintenance-update-distribution",
      name: "Coin Maintenance Update Distribution",
    })
    const composition = await createComposition({
      code: "coin-maintenance-update-composition",
      name: "Coin Maintenance Update Composition",
    })
    const replacementComposition = await createComposition({
      code: "coin-maintenance-update-replacement-composition",
      name: "Coin Maintenance Update Replacement Composition",
    })
    const currency = await createCurrency({
      code: "coin-maintenance-update-currency",
      name: "CMU",
      fullName: "Coin Maintenance Update Currency",
    })
    const firstRuler = await createRuler({
      code: "coin-maintenance-update-ruler-first",
      name: "Coin Maintenance Update Ruler First",
    })
    const secondRuler = await createRuler({
      code: "coin-maintenance-update-ruler-second",
      name: "Coin Maintenance Update Ruler Second",
    })
    const thirdRuler = await createRuler({
      code: "coin-maintenance-update-ruler-third",
      name: "Coin Maintenance Update Ruler Third",
    })
    const firstMint = await createMint({
      code: "coin-maintenance-update-mint-first",
      name: "Coin Maintenance Update Mint First",
    })
    const secondMint = await createMint({
      code: "coin-maintenance-update-mint-second",
      name: "Coin Maintenance Update Mint Second",
    })
    const firstTheme = await createTheme({
      code: "coin-maintenance-update-theme-first",
      name: "Coin Maintenance Update Theme First",
    })
    const secondTheme = await createTheme({
      code: "coin-maintenance-update-theme-second",
      name: "Coin Maintenance Update Theme Second",
    })

    const createdCoin = await createCoinMaintenance({
      comments: null,
      compositionDescription: "Copper-nickel ring with brass core",
      compositionId: composition.id,
      currencyId: currency.id,
      diameter: null,
      distributionId: distribution.id,
      edgeId: null,
      faceValueNumericValue: 1,
      faceValueText: "1 Unit",
      isDemonetized: false,
      issuerId: issuer.id,
      maxYear: null,
      minYear: null,
      mintIds: [firstMint.id],
      mintage: null,
      orientationId: null,
      rimId: null,
      rulerIds: [firstRuler.id],
      shapeId: null,
      techniqueId: null,
      themeIds: [firstTheme.id],
      thickness: null,
      title: "Coin Maintenance Update Coin",
      weight: null,
    })

    const beforeUpdate = await db.query.coin.findFirst({
      where: (record, { eq }) => eq(record.id, createdCoin.id),
    })

    const updatedFields = {
      comments: "Updated public note",
      compositionDescription: "Copper-nickel ring with brass core",
      compositionId: replacementComposition.id,
      currencyId: currency.id,
      diameter: 24,
      distributionId: distribution.id,
      edgeId: null,
      faceValueNumericValue: 5,
      faceValueText: "5 Units",
      isDemonetized: true,
      issuerId: issuer.id,
      maxYear: 2025,
      minYear: 2024,
      mintIds: [secondMint.id, firstMint.id],
      mintage: 2000,
      orientationId: null,
      rimId: null,
      rulerIds: [secondRuler.id, thirdRuler.id],
      shapeId: null,
      techniqueId: null,
      themeIds: [secondTheme.id],
      thickness: 2.1,
      title: "Updated Coin Maintenance Coin",
      weight: 8.2,
    }
    const updatedCoin = await updateCoinMaintenance({
      id: createdCoin.id,
      ...updatedFields,
    })

    expect(updatedCoin).toMatchObject({
      id: createdCoin.id,
      version: 2,
      title: "Updated Coin Maintenance Coin",
      comments: "Updated public note",
      compositionDescription: "Copper-nickel ring with brass core",
      compositionId: replacementComposition.id,
      faceValueText: "5 Units",
      faceValueNumericValue: 5,
      minYear: 2024,
      maxYear: 2025,
      mintage: 2000,
      isDemonetized: true,
      diameter: 24,
      thickness: 2.1,
      weight: 8.2,
    })

    const persistedRulers = await db.query.coinRuler.findMany({
      where: (record, { eq }) => eq(record.coinId, createdCoin.id),
      orderBy: (record, { asc }) => asc(record.rulerOrder),
    })

    expect(persistedRulers).toStrictEqual([
      {
        coinId: createdCoin.id,
        rulerId: secondRuler.id,
        rulerOrder: 1,
      },
      {
        coinId: createdCoin.id,
        rulerId: thirdRuler.id,
        rulerOrder: 2,
      },
    ])

    await expect(
      db.query.coinMint.findMany({
        where: (record, { eq }) => eq(record.coinId, createdCoin.id),
        orderBy: (record, { asc }) => asc(record.mintId),
      })
    ).resolves.toStrictEqual([
      {
        coinId: createdCoin.id,
        mintId: firstMint.id,
      },
      {
        coinId: createdCoin.id,
        mintId: secondMint.id,
      },
    ])

    await expect(
      db.query.coinTheme.findMany({
        where: (record, { eq }) => eq(record.coinId, createdCoin.id),
        orderBy: (record, { asc }) => asc(record.themeId),
      })
    ).resolves.toStrictEqual([
      {
        coinId: createdCoin.id,
        themeId: secondTheme.id,
      },
    ])

    const persistedCoin = await db.query.coin.findFirst({
      where: (record, { eq }) => eq(record.id, createdCoin.id),
    })

    expect(persistedCoin?.updatedAt.getTime()).toBeGreaterThanOrEqual(
      beforeUpdate?.updatedAt.getTime() ?? 0
    )

    const revisedCoin = await updateCoinMaintenance({
      id: createdCoin.id,
      ...updatedFields,
      compositionDescription: "  Revised copper-nickel and brass detail.  ",
    })

    expect(revisedCoin?.compositionDescription).toBe(
      "Revised copper-nickel and brass detail."
    )

    const clearedCoin = await updateCoinMaintenance({
      id: createdCoin.id,
      ...updatedFields,
      compositionDescription: "  ",
    })

    expect(clearedCoin?.compositionDescription).toBeNull()
  })

  it("stores independent Composition Descriptions for Coins sharing one Composition", async () => {
    const issuer = await createIssuer({
      code: "coin-maintenance-shared-composition-issuer",
      name: "Coin Maintenance Shared Composition Issuer",
    })
    const ruler = await createRuler({
      code: "coin-maintenance-shared-composition-ruler",
      name: "Coin Maintenance Shared Composition Ruler",
    })
    const distribution = await createDistribution({
      code: "coin-maintenance-shared-composition-distribution",
      name: "Coin Maintenance Shared Composition Distribution",
    })
    const composition = await createComposition({
      code: "coin-maintenance-shared-composition",
      name: "Bimetallic",
    })
    const currency = await createCurrency({
      code: "coin-maintenance-shared-composition-currency",
      name: "CMSC",
      fullName: "Coin Maintenance Shared Composition Currency",
    })
    const baseFields = {
      comments: null,
      compositionDescription: null,
      compositionId: composition.id,
      currencyId: currency.id,
      diameter: null,
      distributionId: distribution.id,
      edgeId: null,
      faceValueNumericValue: 1,
      faceValueText: "1 Unit",
      isDemonetized: null,
      issuerId: issuer.id,
      maxYear: null,
      minYear: null,
      mintIds: [],
      mintage: null,
      orientationId: null,
      rimId: null,
      rulerIds: [ruler.id],
      shapeId: null,
      techniqueId: null,
      themeIds: [],
      thickness: null,
      weight: null,
    }

    const firstCoin = await createCoinMaintenance({
      ...baseFields,
      compositionDescription: "Outer ring: copper-nickel; core: nickel-brass.",
      title: "First Shared Composition Coin",
    })
    const secondCoin = await createCoinMaintenance({
      ...baseFields,
      compositionDescription: "Outer ring: nickel-brass; core: copper-nickel.",
      title: "Second Shared Composition Coin",
    })

    await expect(
      Promise.all([
        getCoinMaintenanceRecord(firstCoin.id),
        getCoinMaintenanceRecord(secondCoin.id),
      ])
    ).resolves.toMatchObject([
      {
        compositionId: composition.id,
        compositionDescription:
          "Outer ring: copper-nickel; core: nickel-brass.",
      },
      {
        compositionId: composition.id,
        compositionDescription:
          "Outer ring: nickel-brass; core: copper-nickel.",
      },
    ])
  })

  it("replaces owned child collections from submitted edit state, including removals back to empty", async () => {
    const issuer = await createIssuer({
      code: "coin-maintenance-replace-empty-issuer",
      name: "Coin Maintenance Replace Empty Issuer",
    })
    const distribution = await createDistribution({
      code: "coin-maintenance-replace-empty-distribution",
      name: "Coin Maintenance Replace Empty Distribution",
    })
    const composition = await createComposition({
      code: "coin-maintenance-replace-empty-composition",
      name: "Coin Maintenance Replace Empty Composition",
    })
    const currency = await createCurrency({
      code: "coin-maintenance-replace-empty-currency",
      name: "CME",
      fullName: "Coin Maintenance Replace Empty Currency",
    })
    const ruler = await createRuler({
      code: "coin-maintenance-replace-empty-ruler",
      name: "Coin Maintenance Replace Empty Ruler",
    })
    const mint = await createMint({
      code: "coin-maintenance-replace-empty-mint",
      name: "Coin Maintenance Replace Empty Mint",
    })
    const theme = await createTheme({
      code: "coin-maintenance-replace-empty-theme",
      name: "Coin Maintenance Replace Empty Theme",
    })
    const catalogue = await createCatalogue({
      code: "replace-empty-catalogue",
      title: "Replace Empty Catalogue",
    })
    const engraver = await createEngraver({
      code: "replace-empty-engraver",
      name: "Replace Empty Engraver",
    })

    const createdCoin = await createCoinMaintenance({
      comments: null,
      compositionDescription: null,
      compositionId: composition.id,
      currencyId: currency.id,
      diameter: null,
      distributionId: distribution.id,
      edgeId: null,
      faceValueNumericValue: 1,
      faceValueText: "1 Unit",
      isDemonetized: null,
      issuerId: issuer.id,
      maxYear: null,
      mintIds: [mint.id],
      minYear: null,
      mintage: null,
      orientationId: null,
      references: [
        {
          catalogueId: catalogue.id,
          number: "RE 1",
        },
      ],
      rimId: null,
      rulerIds: [ruler.id],
      shapeId: null,
      surfaces: {
        obverse: {
          description: "Original obverse",
          lettering: null,
          imageUrl: null,
          engraverIds: [engraver.id],
        },
        reverse: null,
        edge: null,
      },
      techniqueId: null,
      themeIds: [theme.id],
      thickness: null,
      title: "Coin Maintenance Replace Empty Coin",
      weight: null,
    })

    await updateCoinMaintenance({
      id: createdCoin.id,
      comments: null,
      compositionDescription: null,
      compositionId: composition.id,
      currencyId: currency.id,
      diameter: null,
      distributionId: distribution.id,
      edgeId: null,
      faceValueNumericValue: 1,
      faceValueText: "1 Unit",
      isDemonetized: null,
      issuerId: issuer.id,
      maxYear: null,
      mintIds: [],
      minYear: null,
      mintage: null,
      orientationId: null,
      references: [],
      rimId: null,
      rulerIds: [ruler.id],
      shapeId: null,
      surfaces: {
        obverse: null,
        reverse: null,
        edge: null,
      },
      techniqueId: null,
      themeIds: [],
      thickness: null,
      title: "Coin Maintenance Replace Empty Coin",
      weight: null,
    })

    await expect(
      getCoinMaintenanceRecord(createdCoin.id)
    ).resolves.toMatchObject({
      mintIds: [],
      references: [],
      surfaces: {
        obverse: null,
        reverse: null,
        edge: null,
      },
      themeIds: [],
    })

    await expect(
      db.query.coinMint.findMany({
        where: (record, { eq }) => eq(record.coinId, createdCoin.id),
      })
    ).resolves.toHaveLength(0)
    await expect(
      db.query.coinTheme.findMany({
        where: (record, { eq }) => eq(record.coinId, createdCoin.id),
      })
    ).resolves.toHaveLength(0)
    await expect(
      db.query.coinReference.findMany({
        where: (record, { eq }) => eq(record.coinId, createdCoin.id),
      })
    ).resolves.toHaveLength(0)
    await expect(
      db.query.coinSurface.findMany({
        where: (record, { eq }) => eq(record.coinId, createdCoin.id),
      })
    ).resolves.toHaveLength(0)
    await expect(db.query.coinSurfaceEngraver.findMany()).resolves.toHaveLength(
      0
    )
  })

  it("creates and replaces Catalogue References and Surface Set details atomically", async () => {
    const issuer = await createIssuer({
      code: "coin-maintenance-aggregate-issuer",
      name: "Coin Maintenance Aggregate Issuer",
    })
    const distribution = await createDistribution({
      code: "coin-maintenance-aggregate-distribution",
      name: "Coin Maintenance Aggregate Distribution",
    })
    const composition = await createComposition({
      code: "coin-maintenance-aggregate-composition",
      name: "Coin Maintenance Aggregate Composition",
    })
    const currency = await createCurrency({
      code: "coin-maintenance-aggregate-currency",
      name: "CMA",
      fullName: "Coin Maintenance Aggregate Currency",
    })
    const ruler = await createRuler({
      code: "coin-maintenance-aggregate-ruler",
      name: "Coin Maintenance Aggregate Ruler",
    })
    const firstCatalogue = await createCatalogue({
      code: "km-aggregate",
      title: "Krause Mishler Aggregate",
    })
    const secondCatalogue = await createCatalogue({
      code: "cn-aggregate",
      title: "Calico Aggregate",
    })
    const firstEngraver = await createEngraver({
      code: "aggregate-engraver-first",
      name: "Aggregate Engraver First",
    })
    const secondEngraver = await createEngraver({
      code: "aggregate-engraver-second",
      name: "Aggregate Engraver Second",
    })

    const createdCoin = await createCoinMaintenance({
      comments: null,
      compositionDescription: null,
      compositionId: composition.id,
      currencyId: currency.id,
      diameter: null,
      distributionId: distribution.id,
      edgeId: null,
      faceValueNumericValue: 1,
      faceValueText: "1 Unit",
      isDemonetized: null,
      issuerId: issuer.id,
      maxYear: null,
      mintIds: [],
      minYear: null,
      mintage: null,
      orientationId: null,
      rimId: null,
      rulerIds: [ruler.id],
      shapeId: null,
      techniqueId: null,
      themeIds: [],
      thickness: null,
      title: "Coin Maintenance Aggregate Coin",
      weight: null,
      references: [
        {
          catalogueId: firstCatalogue.id,
          number: " KM 12 ",
        },
      ],
      surfaces: {
        obverse: {
          description: "  Laureate bust right  ",
          lettering: "  CAROLUS III  ",
          imageUrl: "  https://example.com/obverse-image.jpg  ",
          engraverIds: [firstEngraver.id],
        },
        reverse: null,
        edge: {
          description: "",
          lettering: "",
          imageUrl: "",
        },
      },
    })

    await expect(
      getCoinMaintenanceRecord(createdCoin.id)
    ).resolves.toStrictEqual({
      id: createdCoin.id,
      title: "Coin Maintenance Aggregate Coin",
      comments: null,
      compositionDescription: null,
      compositionId: composition.id,
      currencyId: currency.id,
      diameter: null,
      distributionId: distribution.id,
      edgeId: null,
      faceValueNumericValue: 1,
      faceValueText: "1 Unit",
      isDemonetized: null,
      issuerId: issuer.id,
      maxYear: null,
      mintIds: [],
      minYear: null,
      mintage: null,
      orientationId: null,
      rimId: null,
      rulerIds: [ruler.id],
      shapeId: null,
      techniqueId: null,
      themeIds: [],
      thickness: null,
      weight: null,
      references: [
        {
          catalogueId: firstCatalogue.id,
          number: "KM 12",
        },
      ],
      surfaces: {
        obverse: {
          description: "Laureate bust right",
          lettering: "CAROLUS III",
          imageUrl: "https://example.com/obverse-image.jpg",
          engraverIds: [firstEngraver.id],
        },
        reverse: null,
        edge: null,
      },
      version: 1,
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    })

    const beforeUpdate = await db.query.coin.findFirst({
      where: (record, { eq }) => eq(record.id, createdCoin.id),
    })

    await updateCoinMaintenance({
      id: createdCoin.id,
      comments: null,
      compositionDescription: null,
      compositionId: composition.id,
      currencyId: currency.id,
      diameter: null,
      distributionId: distribution.id,
      edgeId: null,
      faceValueNumericValue: 1,
      faceValueText: "1 Unit",
      isDemonetized: null,
      issuerId: issuer.id,
      maxYear: null,
      mintIds: [],
      minYear: null,
      mintage: null,
      orientationId: null,
      rimId: null,
      rulerIds: [ruler.id],
      shapeId: null,
      techniqueId: null,
      themeIds: [],
      thickness: null,
      title: "Coin Maintenance Aggregate Coin",
      weight: null,
      references: [
        {
          catalogueId: secondCatalogue.id,
          number: "CN 55",
        },
      ],
      surfaces: {
        obverse: {
          description: "Updated obverse",
          lettering: null,
          imageUrl: null,
          engraverIds: [secondEngraver.id],
        },
        reverse: {
          description: null,
          lettering: "Updated reverse lettering",
          imageUrl: "https://example.com/reverse-image.jpg",
          engraverIds: [firstEngraver.id, secondEngraver.id],
        },
        edge: {
          description: "Reeded",
          lettering: null,
          imageUrl: null,
        },
      },
    })

    await expect(
      db.query.coinReference.findMany({
        where: (record, { eq }) => eq(record.coinId, createdCoin.id),
        orderBy: (record, { asc }) => asc(record.number),
      })
    ).resolves.toHaveLength(1)

    await expect(
      db.query.coinSurface.findMany({
        where: (record, { eq }) => eq(record.coinId, createdCoin.id),
      })
    ).resolves.toHaveLength(3)

    await expect(db.query.coinSurfaceEngraver.findMany()).resolves.toHaveLength(
      3
    )

    const persistedCoin = await db.query.coin.findFirst({
      where: (record, { eq }) => eq(record.id, createdCoin.id),
    })

    expect(persistedCoin?.updatedAt.getTime()).toBeGreaterThanOrEqual(
      beforeUpdate?.updatedAt.getTime() ?? 0
    )
  })

  it("rolls back failed aggregate edits and leaves the existing references and surfaces unchanged", async () => {
    const issuer = await createIssuer({
      code: "coin-maintenance-rollback-issuer",
      name: "Coin Maintenance Rollback Issuer",
    })
    const distribution = await createDistribution({
      code: "coin-maintenance-rollback-distribution",
      name: "Coin Maintenance Rollback Distribution",
    })
    const composition = await createComposition({
      code: "coin-maintenance-rollback-composition",
      name: "Coin Maintenance Rollback Composition",
    })
    const currency = await createCurrency({
      code: "coin-maintenance-rollback-currency",
      name: "CMR",
      fullName: "Coin Maintenance Rollback Currency",
    })
    const ruler = await createRuler({
      code: "coin-maintenance-rollback-ruler",
      name: "Coin Maintenance Rollback Ruler",
    })
    const catalogue = await createCatalogue({
      code: "rollback-km",
      title: "Rollback KM",
    })
    const engraver = await createEngraver({
      code: "rollback-engraver",
      name: "Rollback Engraver",
    })

    const createdCoin = await createCoinMaintenance({
      comments: null,
      compositionDescription: null,
      compositionId: composition.id,
      currencyId: currency.id,
      diameter: null,
      distributionId: distribution.id,
      edgeId: null,
      faceValueNumericValue: 1,
      faceValueText: "1 Unit",
      isDemonetized: null,
      issuerId: issuer.id,
      maxYear: null,
      mintIds: [],
      minYear: null,
      mintage: null,
      orientationId: null,
      rimId: null,
      rulerIds: [ruler.id],
      shapeId: null,
      techniqueId: null,
      themeIds: [],
      thickness: null,
      title: "Coin Maintenance Rollback Coin",
      weight: null,
      references: [
        {
          catalogueId: catalogue.id,
          number: "RB 1",
        },
      ],
      surfaces: {
        obverse: {
          description: "Original obverse",
          lettering: null,
          imageUrl: null,
          engraverIds: [engraver.id],
        },
        reverse: null,
        edge: null,
      },
    })

    await expect(
      updateCoinMaintenance({
        id: createdCoin.id,
        comments: null,
        compositionDescription: null,
        compositionId: composition.id,
        currencyId: currency.id,
        diameter: null,
        distributionId: distribution.id,
        edgeId: null,
        faceValueNumericValue: 1,
        faceValueText: "1 Unit",
        isDemonetized: null,
        issuerId: issuer.id,
        maxYear: null,
        minYear: null,
        mintage: null,
        orientationId: null,
        rimId: null,
        rulerIds: [ruler.id],
        shapeId: null,
        techniqueId: null,
        mintIds: [],
        themeIds: [],
        thickness: null,
        title: "Coin Maintenance Rollback Coin",
        weight: null,
        references: [
          {
            catalogueId: catalogue.id,
            number: "RB 2",
          },
        ],
        surfaces: {
          obverse: {
            description: "Broken obverse",
            lettering: null,
            imageUrl: null,
            engraverIds: ["00000000-0000-0000-0000-000000000000"],
          },
          reverse: null,
          edge: null,
        },
      })
    ).rejects.toThrow()

    await expect(
      getCoinMaintenanceRecord(createdCoin.id)
    ).resolves.toMatchObject({
      references: [
        {
          catalogueId: catalogue.id,
          number: "RB 1",
        },
      ],
      surfaces: {
        obverse: {
          description: "Original obverse",
          engraverIds: [engraver.id],
        },
        reverse: null,
        edge: null,
      },
    })
  })

  it("returns null when updating a missing Coin instead of recreating it", async () => {
    const issuer = await createIssuer({
      code: "coin-maintenance-missing-issuer",
      name: "Coin Maintenance Missing Issuer",
    })
    const distribution = await createDistribution({
      code: "coin-maintenance-missing-distribution",
      name: "Coin Maintenance Missing Distribution",
    })
    const composition = await createComposition({
      code: "coin-maintenance-missing-composition",
      name: "Coin Maintenance Missing Composition",
    })
    const currency = await createCurrency({
      code: "coin-maintenance-missing-currency",
      name: "CMM",
      fullName: "Coin Maintenance Missing Currency",
    })
    const ruler = await createRuler({
      code: "coin-maintenance-missing-ruler",
      name: "Coin Maintenance Missing Ruler",
    })

    await expect(
      updateCoinMaintenance({
        id: "2c717ddb-95a2-4dad-a280-f58a4779aee8",
        comments: null,
        compositionDescription: null,
        compositionId: composition.id,
        currencyId: currency.id,
        diameter: null,
        distributionId: distribution.id,
        edgeId: null,
        faceValueNumericValue: 1,
        faceValueText: "1 Unit",
        isDemonetized: null,
        issuerId: issuer.id,
        maxYear: null,
        minYear: null,
        mintIds: [],
        mintage: null,
        orientationId: null,
        rimId: null,
        rulerIds: [ruler.id],
        shapeId: null,
        techniqueId: null,
        themeIds: [],
        thickness: null,
        title: "Missing Coin",
        weight: null,
      })
    ).resolves.toBeNull()

    const matchingCoin = await db.query.coin.findFirst({
      where: (record, { eq }) => eq(record.title, "Missing Coin"),
    })

    expect(matchingCoin).toBeUndefined()
  })

  it("hard-deletes the Coin, removes owned child rows, and leaves lookup rows untouched", async () => {
    const issuer = await createIssuer({
      code: "coin-maintenance-delete-issuer",
      name: "Coin Maintenance Delete Issuer",
    })
    const distribution = await createDistribution({
      code: "coin-maintenance-delete-distribution",
      name: "Coin Maintenance Delete Distribution",
    })
    const composition = await createComposition({
      code: "coin-maintenance-delete-composition",
      name: "Coin Maintenance Delete Composition",
    })
    const currency = await createCurrency({
      code: "coin-maintenance-delete-currency",
      name: "CMD",
      fullName: "Coin Maintenance Delete Currency",
    })
    const ruler = await createRuler({
      code: "coin-maintenance-delete-ruler",
      name: "Coin Maintenance Delete Ruler",
    })
    const mint = await createMint({
      code: "coin-maintenance-delete-mint",
      name: "Coin Maintenance Delete Mint",
    })
    const theme = await createTheme({
      code: "coin-maintenance-delete-theme",
      name: "Coin Maintenance Delete Theme",
    })
    const catalogue = await createCatalogue({
      code: "coin-maintenance-delete-catalogue",
      title: "Coin Maintenance Delete Catalogue",
    })
    const engraver = await createEngraver({
      code: "coin-maintenance-delete-engraver",
      name: "Coin Maintenance Delete Engraver",
    })

    const createdCoin = await createCoinMaintenance({
      comments: null,
      compositionDescription: null,
      compositionId: composition.id,
      currencyId: currency.id,
      diameter: null,
      distributionId: distribution.id,
      edgeId: null,
      faceValueNumericValue: 1,
      faceValueText: "1 Unit",
      isDemonetized: null,
      issuerId: issuer.id,
      maxYear: null,
      minYear: null,
      mintIds: [mint.id],
      mintage: null,
      orientationId: null,
      references: [
        {
          catalogueId: catalogue.id,
          number: "KM 1",
        },
      ],
      rimId: null,
      rulerIds: [ruler.id],
      shapeId: null,
      surfaces: {
        obverse: {
          description: "Obverse",
          lettering: null,
          imageUrl: null,
          engraverIds: [engraver.id],
        },
        reverse: null,
        edge: null,
      },
      techniqueId: null,
      themeIds: [theme.id],
      thickness: null,
      title: "Coin Maintenance Delete Coin",
      weight: null,
    })

    await expect(
      deleteCoinMaintenance({ id: createdCoin.id })
    ).resolves.toMatchObject({
      id: createdCoin.id,
      title: "Coin Maintenance Delete Coin",
    })

    await expect(
      db.query.coin.findFirst({
        where: (record, { eq }) => eq(record.id, createdCoin.id),
      })
    ).resolves.toBeUndefined()

    await expect(
      db
        .select({ count: count() })
        .from(coinRuler)
        .where(eq(coinRuler.coinId, createdCoin.id))
    ).resolves.toStrictEqual([{ count: 0 }])

    await expect(
      db
        .select({ count: count() })
        .from(coinReference)
        .where(eq(coinReference.coinId, createdCoin.id))
    ).resolves.toStrictEqual([{ count: 0 }])

    await expect(
      db
        .select({ count: count() })
        .from(coinSurface)
        .where(eq(coinSurface.coinId, createdCoin.id))
    ).resolves.toStrictEqual([{ count: 0 }])

    await expect(
      db.select({ count: count() }).from(coinSurfaceEngraver)
    ).resolves.toStrictEqual([{ count: 0 }])

    await expect(
      db.query.catalogue.findFirst({
        where: (record, { eq }) => eq(record.id, catalogue.id),
      })
    ).resolves.toBeDefined()
  })
})
