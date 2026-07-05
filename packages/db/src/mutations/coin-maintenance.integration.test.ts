import { eq } from "drizzle-orm"
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
import { createCoinMaintenance, updateCoinMaintenance } from "./coin-maintenance"
import { getCoinMaintenanceRecord } from "../queries/get-coin-maintenance-record"

describe("coin maintenance mutations integration", () => {
  useTestDatabaseIsolation(db)

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
      title: "Coin Maintenance Create Coin",
      comments: "Public note.",
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
  })

  it("updates the Coin core fields and replaces attribution collections atomically", async () => {
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

    const updatedCoin = await updateCoinMaintenance({
      id: createdCoin.id,
      comments: "Updated public note",
      compositionId: composition.id,
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
    })

    expect(updatedCoin).toMatchObject({
      id: createdCoin.id,
      title: "Updated Coin Maintenance Coin",
      comments: "Updated public note",
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
          thumbnailUrl: "  https://example.com/obverse-thumb.jpg  ",
          imageUrl: "  https://example.com/obverse-image.jpg  ",
          engraverIds: [firstEngraver.id],
        },
        reverse: null,
        edge: {
          description: "",
          lettering: "",
          thumbnailUrl: "",
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
          thumbnailUrl: "https://example.com/obverse-thumb.jpg",
          imageUrl: "https://example.com/obverse-image.jpg",
          engraverIds: [firstEngraver.id],
        },
        reverse: null,
        edge: null,
      },
    })

    const beforeUpdate = await db.query.coin.findFirst({
      where: (record, { eq }) => eq(record.id, createdCoin.id),
    })

    await updateCoinMaintenance({
      id: createdCoin.id,
      comments: null,
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
          thumbnailUrl: null,
          imageUrl: null,
          engraverIds: [secondEngraver.id],
        },
        reverse: {
          description: null,
          lettering: "Updated reverse lettering",
          thumbnailUrl: null,
          imageUrl: "https://example.com/reverse-image.jpg",
          engraverIds: [firstEngraver.id, secondEngraver.id],
        },
        edge: {
          description: "Reeded",
          lettering: null,
          thumbnailUrl: null,
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

    await expect(
      db.query.coinSurfaceEngraver.findMany()
    ).resolves.toHaveLength(3)

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
          thumbnailUrl: null,
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
            thumbnailUrl: null,
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
})
