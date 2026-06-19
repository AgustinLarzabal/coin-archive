import { describe, expect, it } from "vitest"
import { db } from "../index"
import { getCoin } from "./get-coin"
import {
  createCatalogue,
  createCoin,
  createComposition,
  createCoinReference,
  createCoinRuler,
  createCoinSurface,
  createCoinSurfaceEngraver,
  createCoinTheme,
  createEdge,
  createEngraver,
  createIssuer,
  createOrientation,
  createRim,
  createRuler,
  createShape,
  createTechnique,
  createTheme,
} from "../testing/fixtures"
import { useTestDatabaseIsolation } from "../testing/test-database"

describe("getCoin integration", () => {
  useTestDatabaseIsolation(db)

  it("returns the coin detail fields used by the detail page", async () => {
    const spain = await createIssuer({
      code: "spain",
      isoCode: "ES",
      name: "Spain",
    })
    const medalOrientation = await createOrientation({
      code: "medal-alignment",
      name: "Medal alignment",
    })
    const roundShape = await createShape({
      code: "round",
      name: "Round",
    })
    const milledTechnique = await createTechnique({
      code: "milled",
      name: "Milled",
    })
    const silverComposition = await createComposition({
      code: "silver-900",
      name: "Silver .900",
      description: "90% silver, 10% copper",
    })
    const letteredEdge = await createEdge({
      code: "lettered",
      name: "Lettered",
    })
    const raisedRim = await createRim({
      code: "raised-both-sides",
      name: "Raised on both sides",
    })
    const coin = await createCoin({
      title: "Detail Test Coin",
      issuerId: spain.id,
      compositionId: silverComposition.id,
      minYear: 1999,
      maxYear: 2004,
      edgeId: letteredEdge.id,
      mintage: 1250000,
      orientationId: medalOrientation.id,
      rimId: raisedRim.id,
      shapeId: roundShape.id,
      techniqueId: milledTechnique.id,
      createdAt: new Date("2026-06-15T00:00:00.000Z"),
    })
    const obverseSurface = await createCoinSurface({
      coinId: coin.id,
      kind: "obverse",
      description: "Portrait facing left.",
      lettering: "DETAIL TEST",
      thumbnailUrl: "https://example.com/coins/detail-test/obverse-thumb",
      imageUrl: "https://example.com/coins/detail-test/obverse-image",
    })
    await createCoinSurface({
      coinId: coin.id,
      kind: "reverse",
      description: "Denomination and wreath.",
      lettering: "1 TEST UNIT",
      thumbnailUrl: "https://example.com/coins/detail-test/reverse-thumb",
      imageUrl: "https://example.com/coins/detail-test/reverse-image",
    })
    await createCoinSurface({
      coinId: coin.id,
      kind: "edge-surface",
      description: "Reeded edge with stars.",
      lettering: null,
      thumbnailUrl: "https://example.com/coins/detail-test/edge-thumb",
      imageUrl: "https://example.com/coins/detail-test/edge-image",
    })
    const firstEngraver = await createEngraver({
      code: "ana-ruiz",
      name: "Ana Ruiz",
    })
    const secondEngraver = await createEngraver({
      code: "beatriz-lopez",
      name: "Beatriz Lopez",
    })
    await createCoinSurfaceEngraver({
      coinSurfaceId: obverseSurface.id,
      engraverId: secondEngraver.id,
    })
    await createCoinSurfaceEngraver({
      coinSurfaceId: obverseSurface.id,
      engraverId: firstEngraver.id,
    })
    const kmCatalogue = await createCatalogue({
      code: "KM",
      title: "Krause Mishler",
    })
    const cnCatalogue = await createCatalogue({
      code: "CN",
      title: "Custom Numismatics",
    })
    const firstRuler = await createRuler({
      code: "detail-ruler-b",
      name: "Detail Ruler B",
    })
    const secondRuler = await createRuler({
      code: "detail-ruler-a",
      name: "Detail Ruler A",
    })
    const firstTheme = await createTheme({
      code: "architecture",
      name: "Architecture",
    })
    const secondTheme = await createTheme({
      code: "animals",
      name: "Animals",
    })
    await createCoinReference({
      coinId: coin.id,
      catalogueId: kmCatalogue.id,
      number: "12",
    })
    await createCoinReference({
      coinId: coin.id,
      catalogueId: cnCatalogue.id,
      number: "A-5",
    })
    await createCoinRuler({
      coinId: coin.id,
      rulerId: firstRuler.id,
      rulerOrder: 2,
    })
    await createCoinRuler({
      coinId: coin.id,
      rulerId: secondRuler.id,
      rulerOrder: 1,
    })
    await createCoinTheme({
      coinId: coin.id,
      themeId: firstTheme.id,
    })
    await createCoinTheme({
      coinId: coin.id,
      themeId: secondTheme.id,
    })

    const detail = await getCoin(coin.id)

    expect(detail).toMatchObject({
      id: coin.id,
      title: "Detail Test Coin",
      composition: {
        code: "silver-900",
        name: "Silver .900",
        description: "90% silver, 10% copper",
      },
      distribution: {
        code: "standard-circulation",
        name: "Standard circulation",
      },
      edge: {
        code: "lettered",
        name: "Lettered",
      },
      issuer: {
        code: "spain",
        isoCode: "ES",
        name: "Spain",
      },
      mintage: 1250000,
      minYear: 1999,
      maxYear: 2004,
      orientation: {
        code: "medal-alignment",
        name: "Medal alignment",
      },
      rulers: [
        {
          code: "detail-ruler-a",
          name: "Detail Ruler A",
        },
        {
          code: "detail-ruler-b",
          name: "Detail Ruler B",
        },
      ],
      references: [
        {
          catalogue: {
            code: "CN",
            title: "Custom Numismatics",
          },
          number: "A-5",
        },
        {
          catalogue: {
            code: "KM",
            title: "Krause Mishler",
          },
          number: "12",
        },
      ],
      rim: {
        code: "raised-both-sides",
        name: "Raised on both sides",
      },
      shape: {
        code: "round",
        name: "Round",
      },
      surfaces: {
        obverse: {
          description: "Portrait facing left.",
          lettering: "DETAIL TEST",
          thumbnailUrl: "https://example.com/coins/detail-test/obverse-thumb",
          imageUrl: "https://example.com/coins/detail-test/obverse-image",
        },
        reverse: {
          description: "Denomination and wreath.",
          lettering: "1 TEST UNIT",
          thumbnailUrl: "https://example.com/coins/detail-test/reverse-thumb",
          imageUrl: "https://example.com/coins/detail-test/reverse-image",
          engravers: [],
        },
        edge: {
          description: "Reeded edge with stars.",
          lettering: null,
          thumbnailUrl: "https://example.com/coins/detail-test/edge-thumb",
          imageUrl: "https://example.com/coins/detail-test/edge-image",
        },
      },
      technique: {
        code: "milled",
        name: "Milled",
      },
      themes: [
        {
          code: "animals",
          name: "Animals",
        },
        {
          code: "architecture",
          name: "Architecture",
        },
      ],
    })
    expect(detail?.surfaces.obverse?.engravers).toHaveLength(2)
    expect(detail?.surfaces.obverse?.engravers).toEqual(
      expect.arrayContaining([
        {
          code: "beatriz-lopez",
          name: "Beatriz Lopez",
        },
        {
          code: "ana-ruiz",
          name: "Ana Ruiz",
        },
      ])
    )
  })
})
