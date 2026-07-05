import { eq } from "drizzle-orm"
import { describe, expect, it } from "vitest"

import { db } from "../index"
import { coin } from "../schema/coin"
import { coinRuler } from "../schema/coin-ruler"
import {
  createComposition,
  createCurrency,
  createDistribution,
  createEdge,
  createIssuer,
  createOrientation,
  createRim,
  createRuler,
  createShape,
  createTechnique,
} from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"
import { createCoinMaintenance, updateCoinMaintenance } from "./coin-maintenance"

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
      mintage: 1500,
      orientationId: orientation.id,
      rimId: rim.id,
      rulerId: ruler.id,
      shapeId: shape.id,
      techniqueId: technique.id,
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

  it("updates the Coin core fields and replaces the owned Ruler Attribution atomically", async () => {
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
      mintage: null,
      orientationId: null,
      rimId: null,
      rulerId: firstRuler.id,
      shapeId: null,
      techniqueId: null,
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
      mintage: 2000,
      orientationId: null,
      rimId: null,
      rulerId: secondRuler.id,
      shapeId: null,
      techniqueId: null,
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
    ])

    const persistedCoin = await db.query.coin.findFirst({
      where: (record, { eq }) => eq(record.id, createdCoin.id),
    })

    expect(persistedCoin?.updatedAt.getTime()).toBeGreaterThanOrEqual(
      beforeUpdate?.updatedAt.getTime() ?? 0
    )
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
        mintage: null,
        orientationId: null,
        rimId: null,
        rulerId: ruler.id,
        shapeId: null,
        techniqueId: null,
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
