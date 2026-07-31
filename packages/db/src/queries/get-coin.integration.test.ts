import { describe, expect, it } from "vitest"
import { db } from "../index"
import { buildGetCoinQuery, getCoin } from "./get-coin"
import {
  createCatalogue,
  createCoin,
  createCoinMint,
  createComposition,
  createCoinReference,
  createCoinRuler,
  createCoinSurface,
  createCoinSurfaceEngraver,
  createCoinTheme,
  createCurrency,
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

describe("getCoin integration", () => {
  useTestDatabaseIsolation(db)

  it("keeps the base detail query free of one-to-many cartesian joins", () => {
    const query = buildGetCoinQuery(db, "coin-id").toSQL()

    expect(query.sql).toContain('from "coin"')
    expect(query.sql).toContain('"composition"."name"')
    expect(query.sql).toContain('"currency"."full_name"')
    expect(query.sql).toContain('"distribution"."name"')
    expect(query.sql).toContain('"issuer"."iso_code"')
    expect(query.sql).not.toContain('"coin_reference"')
    expect(query.sql).not.toContain('"catalogue"')
    expect(query.sql).not.toContain('"coin_ruler"')
    expect(query.sql).not.toContain('"ruler"')
    expect(query.sql).not.toContain('"coin_mint"')
    expect(query.sql).not.toContain('"mint"')
    expect(query.sql).not.toContain('"coin_theme"')
    expect(query.sql).not.toContain('"theme"')
    expect(query.sql).not.toContain('"coin_surface"')
    expect(query.sql).not.toContain('"coin_face_engraver"')
    expect(query.sql).not.toContain('"engraver"')
    expect(query.params).toEqual(["coin-id"])
  })

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
    const euro = await createCurrency({
      code: "euro",
      name: "Euro",
      fullName: "Euro",
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
      compositionDescription: "90% silver, 10% copper",
      currencyId: euro.id,
      faceValueNumericValue: 2,
      faceValueText: "2 Euros",
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
      imageUrl: "https://example.com/coins/detail-test/obverse-image",
    })
    await createCoinSurface({
      coinId: coin.id,
      kind: "reverse",
      description: "Denomination and wreath.",
      lettering: "1 TEST UNIT",
      imageUrl: "https://example.com/coins/detail-test/reverse-image",
    })
    await createCoinSurface({
      coinId: coin.id,
      kind: "edge-surface",
      description: "Reeded edge with stars.",
      lettering: null,
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
    const firstMint = await createMint({
      code: "madrid-mint",
      name: "Madrid Mint",
    })
    const secondMint = await createMint({
      code: "barcelona-mint",
      name: "Barcelona Mint",
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
    await createCoinMint({
      coinId: coin.id,
      mintId: firstMint.id,
    })
    await createCoinMint({
      coinId: coin.id,
      mintId: secondMint.id,
    })

    const detail = await getCoin(coin.id)

    expect(detail).toMatchObject({
      id: coin.id,
      title: "Detail Test Coin",
      composition: {
        code: "silver-900",
        name: "Silver .900",
      },
      compositionDescription: "90% silver, 10% copper",
      distribution: {
        code: "standard-circulation",
        name: "Standard circulation",
      },
      edge: {
        code: "lettered",
        name: "Lettered",
      },
      faceValue: {
        text: "2 Euros",
        numericValue: 2,
        currency: {
          code: "euro",
          name: "Euro",
          fullName: "Euro",
        },
      },
      issuer: {
        code: "spain",
        isoCode: "ES",
        name: "Spain",
      },
      mintage: 1250000,
      mints: [
        {
          code: "barcelona-mint",
          name: "Barcelona Mint",
        },
        {
          code: "madrid-mint",
          name: "Madrid Mint",
        },
      ],
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
          imageUrl: "https://example.com/coins/detail-test/obverse-image",
        },
        reverse: {
          description: "Denomination and wreath.",
          lettering: "1 TEST UNIT",
          imageUrl: "https://example.com/coins/detail-test/reverse-image",
          engravers: [],
        },
        edge: {
          description: "Reeded edge with stars.",
          lettering: null,
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

  it("returns independent Composition Descriptions for Coins sharing one Composition", async () => {
    const issuer = await createIssuer({
      code: "shared-composition-issuer",
      name: "Shared Composition Issuer",
    })
    const sharedComposition = await createComposition({
      code: "bimetallic",
      name: "Bimetallic",
      description: "Legacy shared text must not be exposed.",
    })
    const firstCoin = await createCoin({
      title: "First Bimetallic Coin",
      issuerId: issuer.id,
      compositionId: sharedComposition.id,
      compositionDescription: "Copper-nickel ring with brass core.",
      createdAt: new Date("2026-07-01T00:00:00.000Z"),
    })
    const secondCoin = await createCoin({
      title: "Second Bimetallic Coin",
      issuerId: issuer.id,
      compositionId: sharedComposition.id,
      compositionDescription: "Brass ring with copper-nickel core.",
      createdAt: new Date("2026-07-02T00:00:00.000Z"),
    })

    const [firstDetail, secondDetail] = await Promise.all([
      getCoin(firstCoin.id),
      getCoin(secondCoin.id),
    ])

    expect(firstDetail).toMatchObject({
      composition: {
        code: "bimetallic",
        name: "Bimetallic",
      },
      compositionDescription: "Copper-nickel ring with brass core.",
    })
    expect(secondDetail).toMatchObject({
      composition: {
        code: "bimetallic",
        name: "Bimetallic",
      },
      compositionDescription: "Brass ring with copper-nickel core.",
    })
    expect(firstDetail?.composition).not.toHaveProperty("description")
    expect(secondDetail?.composition).not.toHaveProperty("description")
  })

  it("returns null when the coin does not exist", async () => {
    await expect(
      getCoin("00000000-0000-0000-0000-000000000000")
    ).resolves.toBeNull()
  })
})
