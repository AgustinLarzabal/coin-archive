import { describe, expect, it } from "vitest"
import { db, getCoins } from "../index"
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

describe("getCoins integration", () => {
  useTestDatabaseIsolation(db)

  it("returns recent coins newest first", async () => {
    const athens = await createIssuer({
      code: "athens",
      name: "Athens",
    })

    await createCoin({
      title: "Earlier Owl",
      issuerId: athens.id,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    })
    await createCoin({
      title: "Latest Owl",
      issuerId: athens.id,
      createdAt: new Date("2026-01-03T00:00:00.000Z"),
    })
    await createCoin({
      title: "Middle Owl",
      issuerId: athens.id,
      createdAt: new Date("2026-01-02T00:00:00.000Z"),
    })

    await expect(getCoins()).resolves.toMatchObject([
      { title: "Latest Owl" },
      { title: "Middle Owl" },
      { title: "Earlier Owl" },
    ])
  })

  it("applies the default recent coin limit of 10", async () => {
    const rome = await createIssuer({
      code: "rome",
      name: "Rome",
    })
    const carthage = await createIssuer({
      code: "carthage",
      name: "Carthage",
    })

    for (let coinNumber = 1; coinNumber <= 12; coinNumber += 1) {
      const isRomanCoin = coinNumber % 2 === 1
      const issuerId = isRomanCoin ? rome.id : carthage.id
      const issuerLabel = isRomanCoin ? "Roman" : "Carthaginian"

      await createCoin({
        title: `${issuerLabel} Test Coin ${coinNumber}`,
        issuerId,
        createdAt: new Date(
          `2026-02-${String(coinNumber).padStart(2, "0")}T00:00:00.000Z`
        ),
      })
    }

    const recentCoins = await getCoins()

    expect(recentCoins).toHaveLength(10)
    expect(recentCoins.map(({ title }) => title)).toStrictEqual([
      "Carthaginian Test Coin 12",
      "Roman Test Coin 11",
      "Carthaginian Test Coin 10",
      "Roman Test Coin 9",
      "Carthaginian Test Coin 8",
      "Roman Test Coin 7",
      "Carthaginian Test Coin 6",
      "Roman Test Coin 5",
      "Carthaginian Test Coin 4",
      "Roman Test Coin 3",
    ])
  })

  it("returns full issuer data and an empty rulers array when a coin has no ruler attributions", async () => {
    const ancientWorld = await createIssuer({
      code: "ancient-world",
      name: "Ancient World",
    })
    const athens = await createIssuer({
      code: "athens",
      name: "Athens",
      parentIssuerId: ancientWorld.id,
    })
    const standardCirculation = await createDistribution({
      code: "standard-circulation",
      name: "Standard circulation",
    })
    const silver900 = await createComposition({
      code: "silver-900",
      description: "Ninety percent silver alloy.",
      name: "Silver (.900)",
    })
    const euro = await createCurrency({
      code: "euro",
      fullName: "Euro (2002-date)",
      name: "Euro",
    })
    const createdAt = new Date("2026-05-01T00:00:00.000Z")
    const coin = await createCoin({
      title: "Ungrouped Civic Issue",
      compositionId: silver900.id,
      currencyId: euro.id,
      distributionId: standardCirculation.id,
      faceValueNumericValue: 2,
      faceValueText: "2 Euros",
      issuerId: athens.id,
      createdAt,
    })

    await expect(getCoins({ limit: 1 })).resolves.toStrictEqual([
      {
        id: coin.id,
        title: "Ungrouped Civic Issue",
        createdAt,
        updatedAt: createdAt,
        comments: null,
        mintage: null,
        issueYearRange: null,
        faceValue: {
          text: "2 Euros",
          numericValue: 2,
          currency: {
            id: euro.id,
            code: "euro",
            name: "Euro",
            fullName: "Euro (2002-date)",
            createdAt: euro.createdAt,
            updatedAt: euro.updatedAt,
          },
        },
        orientation: null,
        obverse: null,
        reverse: null,
        measurements: {
          weight: null,
          diameter: null,
          thickness: null,
        },
        composition: {
          id: silver900.id,
          code: "silver-900",
          name: "Silver (.900)",
          description: "Ninety percent silver alloy.",
          createdAt: silver900.createdAt,
          updatedAt: silver900.updatedAt,
        },
        distribution: {
          id: standardCirculation.id,
          code: "standard-circulation",
          name: "Standard circulation",
          createdAt: standardCirculation.createdAt,
          updatedAt: standardCirculation.updatedAt,
        },
        issuer: {
          id: athens.id,
          code: "athens",
          name: "Athens",
          createdAt: athens.createdAt,
          updatedAt: athens.updatedAt,
          parent: {
            id: ancientWorld.id,
            code: "ancient-world",
            name: "Ancient World",
            createdAt: ancientWorld.createdAt,
            updatedAt: ancientWorld.updatedAt,
          },
        },
        mints: [],
        references: [],
        rulers: [],
      },
    ])
  })

  it("returns face detail objects only when Obverse or Reverse data exists and normalizes blank face text to null output", async () => {
    const spain = await createIssuer({
      code: "spain",
      name: "Spain",
    })

    const noFaceCoin = await createCoin({
      title: "No Face Coin",
      issuerId: spain.id,
      createdAt: new Date("2026-05-01T00:00:00.000Z"),
    })
    const obverseOnlyCoin = await createCoin({
      title: "Obverse Only Coin",
      issuerId: spain.id,
      createdAt: new Date("2026-05-02T00:00:00.000Z"),
    })
    const reverseOnlyCoin = await createCoin({
      title: "Reverse Only Coin",
      issuerId: spain.id,
      createdAt: new Date("2026-05-03T00:00:00.000Z"),
    })
    const blankFaceCoin = await createCoin({
      title: "Blank Face Coin",
      issuerId: spain.id,
      createdAt: new Date("2026-05-04T00:00:00.000Z"),
    })

    await createCoinFace({
      coinId: obverseOnlyCoin.id,
      side: "obverse",
      description: "Crowned shield.",
      lettering: "FELIPE VI",
    })
    await createCoinFace({
      coinId: reverseOnlyCoin.id,
      side: "reverse",
      lettering: "2 EURO",
    })
    await createCoinFace({
      coinId: blankFaceCoin.id,
      side: "obverse",
      description: "   ",
      lettering: "\n\t",
    })

    await expect(getCoins({ limit: 4 })).resolves.toMatchObject([
      {
        id: blankFaceCoin.id,
        obverse: null,
        reverse: null,
      },
      {
        id: reverseOnlyCoin.id,
        obverse: null,
        reverse: {
          description: null,
          lettering: "2 EURO",
          engravers: [],
        },
      },
      {
        id: obverseOnlyCoin.id,
        obverse: {
          description: "Crowned shield.",
          lettering: "FELIPE VI",
          engravers: [],
        },
        reverse: null,
      },
      {
        id: noFaceCoin.id,
        obverse: null,
        reverse: null,
      },
    ])
  })

  it("returns sorted face-level Engravers, deduplicates join multiplication, and filters by engraverCode across either face", async () => {
    const spain = await createIssuer({
      code: "spain",
      name: "Spain",
    })
    const mapTheme = await createTheme({
      code: "map",
      name: "Map",
    })
    const portraitTheme = await createTheme({
      code: "portrait",
      name: "Portrait",
    })
    const madridMint = await createMint({
      code: "royal-mint-of-madrid",
      name: "Royal Mint of Madrid",
    })
    const georgios = await createEngraver({
      code: "georgios-stamatopoulos",
      name: "Georgios Stamatópoulos",
    })
    const alpha = await createEngraver({
      code: "alpha-engraver",
      name: "Alpha Engraver",
    })
    const beta = await createEngraver({
      code: "beta-engraver",
      name: "Alpha Engraver",
    })
    const faceOnlyCoin = await createCoin({
      title: "Face Engraver Coin",
      issuerId: spain.id,
      createdAt: new Date("2026-05-05T00:00:00.000Z"),
    })
    const obverseFace = await createCoinFace({
      coinId: faceOnlyCoin.id,
      side: "obverse",
    })
    const reverseFace = await createCoinFace({
      coinId: faceOnlyCoin.id,
      side: "reverse",
      lettering: "2 EURO",
    })
    const filteredOutCoin = await createCoin({
      title: "Different Engraver Coin",
      issuerId: spain.id,
      createdAt: new Date("2026-05-04T00:00:00.000Z"),
    })
    const filteredOutFace = await createCoinFace({
      coinId: filteredOutCoin.id,
      side: "obverse",
    })
    const otherEngraver = await createEngraver({
      code: "other-engraver",
      name: "Other Engraver",
    })

    await createCoinTheme({
      coinId: faceOnlyCoin.id,
      themeId: mapTheme.id,
    })
    await createCoinTheme({
      coinId: faceOnlyCoin.id,
      themeId: portraitTheme.id,
    })
    await createCoinMint({
      coinId: faceOnlyCoin.id,
      mintId: madridMint.id,
    })
    await createCoinFaceEngraver({
      coinFaceId: obverseFace.id,
      engraverId: beta.id,
    })
    await createCoinFaceEngraver({
      coinFaceId: obverseFace.id,
      engraverId: alpha.id,
    })
    await createCoinFaceEngraver({
      coinFaceId: reverseFace.id,
      engraverId: georgios.id,
    })
    await createCoinFaceEngraver({
      coinFaceId: filteredOutFace.id,
      engraverId: otherEngraver.id,
    })

    await expect(
      getCoins({
        engraverCode: "georgios-stamatopoulos",
        limit: 10,
      })
    ).resolves.toMatchObject([
      {
        id: faceOnlyCoin.id,
        obverse: {
          description: null,
          lettering: null,
          engravers: [
            {
              id: alpha.id,
              code: "alpha-engraver",
              name: "Alpha Engraver",
            },
            {
              id: beta.id,
              code: "beta-engraver",
              name: "Alpha Engraver",
            },
          ],
        },
        reverse: {
          description: null,
          lettering: "2 EURO",
          engravers: [
            {
              id: georgios.id,
              code: "georgios-stamatopoulos",
              name: "Georgios Stamatópoulos",
            },
          ],
        },
      },
    ])
  })

  it("returns known mintage and null for unknown mintage in coin records", async () => {
    const spain = await createIssuer({
      code: "spain",
      name: "Spain",
    })

    const unknownMintageCoin = await createCoin({
      title: "Unknown Mintage Issue",
      issuerId: spain.id,
      createdAt: new Date("2026-05-01T00:00:00.000Z"),
    })
    const knownMintageCoin = await createCoin({
      title: "Known Mintage Issue",
      issuerId: spain.id,
      mintage: 1234567,
      createdAt: new Date("2026-05-02T00:00:00.000Z"),
    })

    await expect(getCoins({ limit: 2 })).resolves.toMatchObject([
      {
        id: knownMintageCoin.id,
        title: "Known Mintage Issue",
        mintage: 1234567,
      },
      {
        id: unknownMintageCoin.id,
        title: "Unknown Mintage Issue",
        mintage: null,
      },
    ])
  })

  it("returns present comments and stable null comments through multiplied joined rows", async () => {
    const spain = await createIssuer({
      code: "spain",
      name: "Spain",
    })
    const madrid = await createMint({
      code: "madrid",
      name: "Madrid",
    })
    const mapTheme = await createTheme({
      code: "map",
      name: "Map",
    })

    const uncommentedCoin = await createCoin({
      title: "Uncommented Coin",
      issuerId: spain.id,
      createdAt: new Date("2026-05-03T00:00:00.000Z"),
    })
    const commentedCoin = await createCoin({
      title: "Commented Coin",
      issuerId: spain.id,
      comments: "Public catalogue note.\nSecond line.",
      createdAt: new Date("2026-05-04T00:00:00.000Z"),
    })

    await createCoinMint({
      coinId: commentedCoin.id,
      mintId: madrid.id,
    })
    await createCoinTheme({
      coinId: commentedCoin.id,
      themeId: mapTheme.id,
    })

    await expect(getCoins({ limit: 2 })).resolves.toMatchObject([
      {
        id: commentedCoin.id,
        title: "Commented Coin",
        comments: "Public catalogue note.\nSecond line.",
        mints: [
          {
            id: madrid.id,
          },
        ],
        themes: [
          {
            id: mapTheme.id,
          },
        ],
      },
      {
        id: uncommentedCoin.id,
        title: "Uncommented Coin",
        comments: null,
      },
    ])
  })

  it("returns a stable mints array with empty, single-mint, and multiple-mint coin records", async () => {
    const spain = await createIssuer({
      code: "spain",
      name: "Spain",
    })
    const buenosAiresMint = await createMint({
      code: "buenos-aires-mint",
      name: "Buenos Aires Mint",
    })
    const denverSameNameMint = await createMint({
      code: "denver-mint",
      name: "Mint",
    })
    const philadelphiaSameNameMint = await createMint({
      code: "philadelphia-mint",
      name: "Mint",
    })
    const royalMintOfMadrid = await createMint({
      code: "royal-mint-of-madrid",
      name: "Royal Mint of Madrid",
    })
    const coinWithoutMint = await createCoin({
      title: "Unknown Mint Issue",
      issuerId: spain.id,
      createdAt: new Date("2026-05-01T00:00:00.000Z"),
    })
    const coinWithMint = await createCoin({
      title: "Known Mint Issue",
      issuerId: spain.id,
      createdAt: new Date("2026-05-02T00:00:00.000Z"),
    })
    const coinWithMultipleMints = await createCoin({
      title: "Shared Mint Issue",
      issuerId: spain.id,
      createdAt: new Date("2026-05-03T00:00:00.000Z"),
    })
    const sharedIssueMintsInAttributionOrder = [
      royalMintOfMadrid,
      philadelphiaSameNameMint,
      denverSameNameMint,
      buenosAiresMint,
    ]
    const expectedSharedIssueMints = [
      buenosAiresMint,
      denverSameNameMint,
      philadelphiaSameNameMint,
      royalMintOfMadrid,
    ].map(({ id, code, name }) => ({
      id,
      code,
      name,
    }))

    await createCoinMint({
      coinId: coinWithMint.id,
      mintId: royalMintOfMadrid.id,
    })
    for (const mintRecord of sharedIssueMintsInAttributionOrder) {
      await createCoinMint({
        coinId: coinWithMultipleMints.id,
        mintId: mintRecord.id,
      })
    }

    await expect(getCoins({ limit: 3 })).resolves.toMatchObject([
      {
        id: coinWithMultipleMints.id,
        title: "Shared Mint Issue",
        mints: expectedSharedIssueMints,
      },
      {
        id: coinWithMint.id,
        title: "Known Mint Issue",
        mints: [
          {
            id: royalMintOfMadrid.id,
            code: "royal-mint-of-madrid",
            name: "Royal Mint of Madrid",
          },
        ],
      },
      {
        id: coinWithoutMint.id,
        title: "Unknown Mint Issue",
        mints: [],
      },
    ])
  })

  it("returns nested themes sorted by name, code, then id while leaving unthemed coins with an empty array", async () => {
    const spain = await createIssuer({
      code: "spain",
      name: "Spain",
    })
    const animalAlt = await createTheme({
      code: "animal-alt",
      name: "Animal",
    })
    const animal = await createTheme({
      code: "animal",
      name: "Animal",
    })
    const portrait = await createTheme({
      code: "portrait",
      name: "Portrait",
    })
    const coinWithoutThemes = await createCoin({
      title: "Unthemed Coin",
      issuerId: spain.id,
      createdAt: new Date("2026-05-01T00:00:00.000Z"),
    })
    const coinWithThemes = await createCoin({
      title: "Multi Theme Coin",
      issuerId: spain.id,
      createdAt: new Date("2026-05-02T00:00:00.000Z"),
    })

    await createCoinTheme({
      coinId: coinWithThemes.id,
      themeId: portrait.id,
    })
    await createCoinTheme({
      coinId: coinWithThemes.id,
      themeId: animal.id,
    })
    await createCoinTheme({
      coinId: coinWithThemes.id,
      themeId: animalAlt.id,
    })

    await expect(getCoins({ limit: 2 })).resolves.toMatchObject([
      {
        id: coinWithThemes.id,
        title: "Multi Theme Coin",
        themes: [
          {
            id: animal.id,
            code: "animal",
            name: "Animal",
          },
          {
            id: animalAlt.id,
            code: "animal-alt",
            name: "Animal",
          },
          {
            id: portrait.id,
            code: "portrait",
            name: "Portrait",
          },
        ],
      },
      {
        id: coinWithoutThemes.id,
        title: "Unthemed Coin",
        themes: [],
      },
    ])
  })

  it("returns known Orientation records with null for unknown values and filters by exact orientation code case-insensitively", async () => {
    const spain = await createIssuer({
      code: "spain",
      name: "Spain",
    })
    const silver900 = await createComposition({
      code: "silver-900",
      description: "Ninety percent silver alloy.",
      name: "Silver (.900)",
    })
    const bronze = await createComposition({
      code: "bronze",
      description: "Bronze alloy.",
      name: "Bronze",
    })
    const coinAlignment = await createOrientation({
      code: "coin-alignment",
      name: "Coin alignment",
    })
    const medalAlignment = await createOrientation({
      code: "medal-alignment",
      name: "Medal alignment",
    })
    const coinWithoutOrientation = await createCoin({
      title: "Unknown Orientation Coin",
      issuerId: spain.id,
      createdAt: new Date("2026-05-01T00:00:00.000Z"),
    })
    const coinAlignmentCoin = await createCoin({
      title: "Coin Alignment Coin",
      compositionId: silver900.id,
      issuerId: spain.id,
      orientationId: coinAlignment.id,
      createdAt: new Date("2026-05-02T00:00:00.000Z"),
    })
    const medalAlignmentCoin = await createCoin({
      title: "Medal Alignment Coin",
      compositionId: bronze.id,
      issuerId: spain.id,
      orientationId: medalAlignment.id,
      createdAt: new Date("2026-05-03T00:00:00.000Z"),
    })

    await expect(getCoins({ limit: 3 })).resolves.toMatchObject([
      {
        id: medalAlignmentCoin.id,
        title: "Medal Alignment Coin",
        orientation: {
          code: "medal-alignment",
          name: "Medal alignment",
        },
      },
      {
        id: coinAlignmentCoin.id,
        title: "Coin Alignment Coin",
        orientation: {
          code: "coin-alignment",
          name: "Coin alignment",
        },
      },
      {
        id: coinWithoutOrientation.id,
        title: "Unknown Orientation Coin",
        orientation: null,
      },
    ])

    await expect(
      getCoins({
        limit: 3,
        orientationCode: "COIN-ALIGNMENT",
      })
    ).resolves.toMatchObject([
      {
        id: coinAlignmentCoin.id,
        title: "Coin Alignment Coin",
      },
    ])

    await expect(
      getCoins({
        compositionCode: "bronze",
        limit: 3,
        orientationCode: "MEDAL-ALIGNMENT",
      })
    ).resolves.toMatchObject([
      {
        id: medalAlignmentCoin.id,
        title: "Medal Alignment Coin",
      },
    ])

    await expect(
      getCoins({
        limit: 3,
        orientationCode: "  ",
      })
    ).resolves.toMatchObject(
      expect.arrayContaining([
        {
          id: coinWithoutOrientation.id,
          title: "Unknown Orientation Coin",
        },
      ])
    )

    await expect(
      getCoins({
        limit: 3,
        orientationCode: "unknown-orientation",
      })
    ).resolves.toStrictEqual([])
  })

  it("returns known Shape and Rim records with null for unknown values and filters both descriptors by exact code case-insensitively", async () => {
    const spain = await createIssuer({
      code: "spain",
      name: "Spain",
    })
    const round = await createShape({
      code: "round",
      name: "Round",
    })
    const scalloped = await createShape({
      code: "scalloped",
      name: "Scalloped",
    })
    const plain = await createRim({
      code: "plain",
      name: "Plain",
    })
    const raisedBothSides = await createRim({
      code: "raised-both-sides",
      name: "Raised, both sides",
    })
    const unknownDescriptorCoin = await createCoin({
      title: "Unknown Descriptor Coin",
      issuerId: spain.id,
      createdAt: new Date("2026-05-01T00:00:00.000Z"),
    })
    const roundRaisedCoin = await createCoin({
      title: "Round Raised Coin",
      issuerId: spain.id,
      shapeId: round.id,
      rimId: raisedBothSides.id,
      createdAt: new Date("2026-05-02T00:00:00.000Z"),
    })
    const scallopedPlainCoin = await createCoin({
      title: "Scalloped Plain Coin",
      issuerId: spain.id,
      shapeId: scalloped.id,
      rimId: plain.id,
      createdAt: new Date("2026-05-03T00:00:00.000Z"),
    })

    await expect(getCoins({ limit: 3 })).resolves.toMatchObject([
      {
        id: scallopedPlainCoin.id,
        title: "Scalloped Plain Coin",
        shape: {
          code: "scalloped",
          name: "Scalloped",
        },
        rim: {
          code: "plain",
          name: "Plain",
        },
      },
      {
        id: roundRaisedCoin.id,
        title: "Round Raised Coin",
        shape: {
          code: "round",
          name: "Round",
        },
        rim: {
          code: "raised-both-sides",
          name: "Raised, both sides",
        },
      },
      {
        id: unknownDescriptorCoin.id,
        title: "Unknown Descriptor Coin",
        shape: null,
        rim: null,
      },
    ])

    await expect(
      getCoins({
        limit: 3,
        shapeCode: "ROUND",
      })
    ).resolves.toMatchObject([
      {
        id: roundRaisedCoin.id,
        title: "Round Raised Coin",
      },
    ])

    await expect(
      getCoins({
        limit: 3,
        rimCode: "PLAIN",
      })
    ).resolves.toMatchObject([
      {
        id: scallopedPlainCoin.id,
        title: "Scalloped Plain Coin",
      },
    ])

    await expect(
      getCoins({
        limit: 3,
        shapeCode: "SCALLOPED",
        rimCode: "PLAIN",
      })
    ).resolves.toMatchObject([
      {
        id: scallopedPlainCoin.id,
        title: "Scalloped Plain Coin",
      },
    ])

    await expect(
      getCoins({
        limit: 3,
        shapeCode: "unknown-shape",
      })
    ).resolves.toStrictEqual([])

    await expect(
      getCoins({
        limit: 3,
        rimCode: "unknown-rim",
      })
    ).resolves.toStrictEqual([])
  })

  it("returns flat Edge data, preserves text-only edge details, and filters by canonical edge code only", async () => {
    const spain = await createIssuer({
      code: "spain",
      name: "Spain",
    })
    const reeded = await createEdge({
      code: "reeded",
      name: "Reeded",
    })
    const security = await createEdge({
      code: "security",
      name: "Security edge",
    })
    const noEdgeCoin = await createCoin({
      title: "No Edge Coin",
      issuerId: spain.id,
      createdAt: new Date("2026-05-01T00:00:00.000Z"),
    })
    const textOnlyEdgeCoin = await createCoin({
      title: "Text Only Edge Coin",
      issuerId: spain.id,
      edgeDescription: "Lettered edge with stars.",
      edgeLettering: "E PLURIBUS UNUM",
      createdAt: new Date("2026-05-02T00:00:00.000Z"),
    })
    const classifiedEdgeCoin = await createCoin({
      title: "Classified Edge Coin",
      issuerId: spain.id,
      edgeId: reeded.id,
      edgeDescription: "Alternating grooves.",
      edgeLettering: "  ",
      createdAt: new Date("2026-05-03T00:00:00.000Z"),
    })
    await createCoin({
      title: "Other Edge Coin",
      issuerId: spain.id,
      edgeId: security.id,
      createdAt: new Date("2026-05-04T00:00:00.000Z"),
    })

    await expect(getCoins({ limit: 4 })).resolves.toMatchObject([
      {
        title: "Other Edge Coin",
        edge: {
          code: "security",
          name: "Security edge",
          description: null,
          lettering: null,
        },
      },
      {
        id: classifiedEdgeCoin.id,
        title: "Classified Edge Coin",
        edge: {
          id: reeded.id,
          code: "reeded",
          name: "Reeded",
          description: "Alternating grooves.",
          lettering: null,
        },
      },
      {
        id: textOnlyEdgeCoin.id,
        title: "Text Only Edge Coin",
        edge: {
          id: null,
          code: null,
          name: null,
          description: "Lettered edge with stars.",
          lettering: "E PLURIBUS UNUM",
        },
      },
      {
        id: noEdgeCoin.id,
        title: "No Edge Coin",
        edge: null,
      },
    ])

    await expect(
      getCoins({
        limit: 4,
        edgeCode: "REEDED",
      })
    ).resolves.toMatchObject([
      {
        id: classifiedEdgeCoin.id,
        title: "Classified Edge Coin",
      },
    ])

    await expect(
      getCoins({
        limit: 4,
        edgeCode: "security",
      })
    ).resolves.toMatchObject([
      {
        title: "Other Edge Coin",
      },
    ])

    await expect(
      getCoins({
        limit: 4,
        edgeCode: "  ",
      })
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: textOnlyEdgeCoin.id,
          title: "Text Only Edge Coin",
        }),
      ])
    )
  })

  it("filters coins by exact theme code case-insensitively, composes with other filters, and still returns all themes on matching coins", async () => {
    const spain = await createIssuer({
      code: "spain",
      name: "Spain",
    })
    const silver900 = await createComposition({
      code: "silver-900",
      description: "Ninety percent silver alloy.",
      name: "Silver (.900)",
    })
    const bronze = await createComposition({
      code: "bronze",
      description: "Bronze alloy.",
      name: "Bronze",
    })
    const map = await createTheme({
      code: "map",
      name: "Map",
    })
    const flag = await createTheme({
      code: "flag",
      name: "Flag",
    })
    const coinWithoutThemes = await createCoin({
      title: "Unthemed Coin",
      issuerId: spain.id,
      createdAt: new Date("2026-05-01T00:00:00.000Z"),
    })
    const mapOnlyCoin = await createCoin({
      title: "Map Only Coin",
      compositionId: silver900.id,
      issuerId: spain.id,
      createdAt: new Date("2026-05-02T00:00:00.000Z"),
    })
    const multiThemeCoin = await createCoin({
      title: "Map and Flag Coin",
      compositionId: bronze.id,
      issuerId: spain.id,
      createdAt: new Date("2026-05-03T00:00:00.000Z"),
    })
    const flagOnlyCoin = await createCoin({
      title: "Flag Only Coin",
      issuerId: spain.id,
      createdAt: new Date("2026-05-04T00:00:00.000Z"),
    })

    await createCoinTheme({
      coinId: mapOnlyCoin.id,
      themeId: map.id,
    })
    await createCoinTheme({
      coinId: multiThemeCoin.id,
      themeId: flag.id,
    })
    await createCoinTheme({
      coinId: multiThemeCoin.id,
      themeId: map.id,
    })
    await createCoinTheme({
      coinId: flagOnlyCoin.id,
      themeId: flag.id,
    })

    await expect(
      getCoins({
        limit: 4,
        themeCode: "MAP",
      })
    ).resolves.toMatchObject([
      {
        id: multiThemeCoin.id,
        title: "Map and Flag Coin",
        themes: [
          {
            code: "flag",
          },
          {
            code: "map",
          },
        ],
      },
      {
        id: mapOnlyCoin.id,
        title: "Map Only Coin",
        themes: [
          {
            code: "map",
          },
        ],
      },
    ])

    await expect(
      getCoins({
        compositionCode: "silver-900",
        limit: 4,
        themeCode: "MAP",
      })
    ).resolves.toMatchObject([
      {
        id: mapOnlyCoin.id,
        title: "Map Only Coin",
      },
    ])

    await expect(
      getCoins({
        limit: 4,
        themeCode: "  ",
      })
    ).resolves.toMatchObject(
      expect.arrayContaining([
        {
          id: coinWithoutThemes.id,
          title: "Unthemed Coin",
        },
      ])
    )

    await expect(
      getCoins({
        limit: 4,
        themeCode: "unknown-theme",
      })
    ).resolves.toStrictEqual([])
  })

  it("filters coins by exact mint code case-insensitively and excludes coins without Mint Attributions only when the filter is applied", async () => {
    const spain = await createIssuer({
      code: "spain",
      name: "Spain",
    })
    const silver900 = await createComposition({
      code: "silver-900",
      description: "Ninety percent silver alloy.",
      name: "Silver (.900)",
    })
    const bronze = await createComposition({
      code: "bronze",
      description: "Bronze alloy.",
      name: "Bronze",
    })
    const philadelphiaMint = await createMint({
      code: "philadelphia-mint",
      name: "Philadelphia Mint",
    })
    const denverMint = await createMint({
      code: "denver-mint",
      name: "Denver Mint",
    })
    const coinWithoutMint = await createCoin({
      title: "Unknown Mint Issue",
      issuerId: spain.id,
      createdAt: new Date("2026-05-01T00:00:00.000Z"),
    })
    const philadelphiaCoin = await createCoin({
      title: "Philadelphia Issue",
      compositionId: silver900.id,
      issuerId: spain.id,
      createdAt: new Date("2026-05-02T00:00:00.000Z"),
    })
    const multiMintCoin = await createCoin({
      title: "Dual Mint Issue",
      compositionId: bronze.id,
      issuerId: spain.id,
      createdAt: new Date("2026-05-03T00:00:00.000Z"),
    })
    const denverCoin = await createCoin({
      title: "Denver Issue",
      issuerId: spain.id,
      createdAt: new Date("2026-05-04T00:00:00.000Z"),
    })
    await createCoinMint({
      coinId: denverCoin.id,
      mintId: denverMint.id,
    })

    await createCoinMint({
      coinId: philadelphiaCoin.id,
      mintId: philadelphiaMint.id,
    })
    await createCoinMint({
      coinId: multiMintCoin.id,
      mintId: philadelphiaMint.id,
    })
    await createCoinMint({
      coinId: multiMintCoin.id,
      mintId: denverMint.id,
    })

    await expect(
      getCoins({
        limit: 4,
        mintCode: "PHILADELPHIA-MINT",
      })
    ).resolves.toMatchObject([
      {
        id: multiMintCoin.id,
        title: "Dual Mint Issue",
      },
      {
        id: philadelphiaCoin.id,
        title: "Philadelphia Issue",
      },
    ])

    await expect(
      getCoins({
        compositionCode: "SILVER-900",
        limit: 4,
        mintCode: "PHILADELPHIA-MINT",
      })
    ).resolves.toMatchObject([
      {
        id: philadelphiaCoin.id,
        title: "Philadelphia Issue",
      },
    ])

    await expect(
      getCoins({
        limit: 4,
        mintCode: "  ",
      })
    ).resolves.toMatchObject(
      expect.arrayContaining([
        {
          id: coinWithoutMint.id,
          title: "Unknown Mint Issue",
        },
      ])
    )
  })

  it("returns the stored issue year range through the shared coin listing", async () => {
    const rome = await createIssuer({
      code: "rome",
      name: "Rome",
    })
    const coin = await createCoin({
      title: "Denarius of Caesar",
      issuerId: rome.id,
      minYear: -43,
      maxYear: -43,
      createdAt: new Date("2026-05-02T00:00:00.000Z"),
    })

    await expect(getCoins({ limit: 1 })).resolves.toMatchObject([
      {
        id: coin.id,
        title: "Denarius of Caesar",
        issueYearRange: {
          minYear: -43,
          maxYear: -43,
        },
      },
    ])
  })

  it("returns grouped measurements and filters weight, diameter, and thickness ranges while excluding unknown values only for the filtered measurement", async () => {
    const rome = await createIssuer({
      code: "rome",
      name: "Rome",
    })

    const measuredMatch = await createCoin({
      title: "Measured Match",
      issuerId: rome.id,
      weight: 4.5,
      diameter: 19.25,
      thickness: 1.75,
      createdAt: new Date("2026-05-06T00:00:00.000Z"),
    })
    await createCoin({
      title: "Measured Miss",
      issuerId: rome.id,
      weight: 2.75,
      diameter: 17.0,
      thickness: 1.2,
      createdAt: new Date("2026-05-05T00:00:00.000Z"),
    })
    await createCoin({
      title: "Unknown Weight",
      issuerId: rome.id,
      diameter: 21.0,
      thickness: 2.0,
      createdAt: new Date("2026-05-04T00:00:00.000Z"),
    })

    await expect(getCoins({ limit: 3 })).resolves.toMatchObject([
      {
        id: measuredMatch.id,
        title: "Measured Match",
        measurements: {
          weight: 4.5,
          diameter: 19.25,
          thickness: 1.75,
        },
      },
      {
        title: "Measured Miss",
        measurements: {
          weight: 2.75,
          diameter: 17,
          thickness: 1.2,
        },
      },
      {
        title: "Unknown Weight",
        measurements: {
          weight: null,
          diameter: 21,
          thickness: 2,
        },
      },
    ])

    await expect(
      getCoins({
        minWeight: 4,
        maxWeight: 5,
      })
    ).resolves.toSatisfy((coins: Array<{ title: string }>) =>
      coins.map(({ title }) => title).join("|") === ["Measured Match"].join("|")
    )

    await expect(
      getCoins({
        minDiameter: 18,
        maxDiameter: 20,
      })
    ).resolves.toSatisfy((coins: Array<{ title: string }>) =>
      coins.map(({ title }) => title).join("|") === ["Measured Match"].join("|")
    )

    await expect(
      getCoins({
        minThickness: 1.5,
      })
    ).resolves.toSatisfy((coins: Array<{ title: string }>) =>
      coins.map(({ title }) => title).join("|") ===
      ["Measured Match", "Unknown Weight"].join("|")
    )
  })

  it("filters coins by exact currency code and inclusive face value range using AND semantics", async () => {
    const spain = await createIssuer({
      code: "spain",
      name: "Spain",
    })
    const france = await createIssuer({
      code: "france",
      name: "France",
    })
    const euro = await createCurrency({
      code: "euro",
      fullName: "Euro (2002-date)",
      name: "Euro",
    })
    const usDollar = await createCurrency({
      code: "united-states-dollar",
      fullName: "United States dollar",
      name: "United States dollar",
    })

    await createCoin({
      title: "Spanish Euro Fraction",
      issuerId: spain.id,
      currencyId: euro.id,
      faceValueNumericValue: 0.5,
      faceValueText: "50 Euro Cent",
      createdAt: new Date("2026-05-05T00:00:00.000Z"),
    })
    await createCoin({
      title: "Spanish Euro Match",
      issuerId: spain.id,
      currencyId: euro.id,
      faceValueNumericValue: 2,
      faceValueText: "2 Euros",
      createdAt: new Date("2026-05-06T00:00:00.000Z"),
    })
    await createCoin({
      title: "Spanish Euro Too Large",
      issuerId: spain.id,
      currencyId: euro.id,
      faceValueNumericValue: 5,
      faceValueText: "5 Euros",
      createdAt: new Date("2026-05-07T00:00:00.000Z"),
    })
    await createCoin({
      title: "Spanish Dollar Wrong Currency",
      issuerId: spain.id,
      currencyId: usDollar.id,
      faceValueNumericValue: 1,
      faceValueText: "1 Dollar",
      createdAt: new Date("2026-05-08T00:00:00.000Z"),
    })
    await createCoin({
      title: "French Euro Wrong Issuer",
      issuerId: france.id,
      currencyId: euro.id,
      faceValueNumericValue: 1,
      faceValueText: "1 Euro",
      createdAt: new Date("2026-05-09T00:00:00.000Z"),
    })

    await expect(
      getCoins({
        currencyCode: "EURO",
        issuerCode: "spain",
        minValue: 0.5,
        maxValue: 2,
      })
    ).resolves.toSatisfy(
      (coins: Array<{ title: string }>) =>
        coins.map(({ title }) => title).join("|") ===
        ["Spanish Euro Match", "Spanish Euro Fraction"].join("|")
    )
  })

  it("filters coins by minimum face value using raw major-unit numeric values", async () => {
    const spain = await createIssuer({
      code: "spain",
      name: "Spain",
    })
    const euro = await createCurrency({
      code: "euro",
      fullName: "Euro (2002-date)",
      name: "Euro",
    })
    const unitedStatesDollar = await createCurrency({
      code: "united-states-dollar",
      fullName: "United States dollar",
      name: "US dollar",
    })

    await createCoin({
      title: "Fifty Euro Cent",
      currencyId: euro.id,
      faceValueNumericValue: 0.5,
      faceValueText: "50 Euro Cent",
      issuerId: spain.id,
      createdAt: new Date("2026-05-09T00:00:00.000Z"),
    })
    const oneDollar = await createCoin({
      title: "One Dollar",
      currencyId: unitedStatesDollar.id,
      faceValueNumericValue: 1,
      faceValueText: "1 Dollar",
      issuerId: spain.id,
      createdAt: new Date("2026-05-08T00:00:00.000Z"),
    })
    const twoEuros = await createCoin({
      title: "Two Euros",
      currencyId: euro.id,
      faceValueNumericValue: 2,
      faceValueText: "2 Euros",
      issuerId: spain.id,
      createdAt: new Date("2026-05-10T00:00:00.000Z"),
    })

    await expect(getCoins({ minValue: 1 })).resolves.toMatchObject([
      {
        id: twoEuros.id,
        title: "Two Euros",
        faceValue: {
          numericValue: 2,
        },
      },
      {
        id: oneDollar.id,
        title: "One Dollar",
        faceValue: {
          numericValue: 1,
        },
      },
    ])
  })

  it("filters coins by maximum face value using an inclusive upper bound", async () => {
    const spain = await createIssuer({
      code: "spain",
      name: "Spain",
    })

    const halfUnit = await createCoin({
      title: "Half Unit",
      faceValueNumericValue: 0.5,
      faceValueText: "Half Unit",
      issuerId: spain.id,
      createdAt: new Date("2026-05-10T00:00:00.000Z"),
    })
    const oneUnit = await createCoin({
      title: "One Unit",
      faceValueNumericValue: 1,
      faceValueText: "1 Unit",
      issuerId: spain.id,
      createdAt: new Date("2026-05-09T00:00:00.000Z"),
    })
    await createCoin({
      title: "Two Units",
      faceValueNumericValue: 2,
      faceValueText: "2 Units",
      issuerId: spain.id,
      createdAt: new Date("2026-05-08T00:00:00.000Z"),
    })

    await expect(getCoins({ maxValue: 1 })).resolves.toMatchObject([
      {
        id: halfUnit.id,
        title: "Half Unit",
        faceValue: {
          numericValue: 0.5,
        },
      },
      {
        id: oneUnit.id,
        title: "One Unit",
        faceValue: {
          numericValue: 1,
        },
      },
    ])
  })

  it("filters coins by an inclusive face value range", async () => {
    const spain = await createIssuer({
      code: "spain",
      name: "Spain",
    })

    const lowerBoundMatch = await createCoin({
      title: "One Unit",
      faceValueNumericValue: 1,
      faceValueText: "1 Unit",
      issuerId: spain.id,
      createdAt: new Date("2026-05-09T00:00:00.000Z"),
    })
    const middleMatch = await createCoin({
      title: "One and a Half Units",
      faceValueNumericValue: 1.5,
      faceValueText: "1.5 Units",
      issuerId: spain.id,
      createdAt: new Date("2026-05-10T00:00:00.000Z"),
    })
    const upperBoundMatch = await createCoin({
      title: "Two Units",
      faceValueNumericValue: 2,
      faceValueText: "2 Units",
      issuerId: spain.id,
      createdAt: new Date("2026-05-08T00:00:00.000Z"),
    })
    await createCoin({
      title: "Quarter Unit",
      faceValueNumericValue: 0.25,
      faceValueText: "Quarter Unit",
      issuerId: spain.id,
      createdAt: new Date("2026-05-07T00:00:00.000Z"),
    })
    await createCoin({
      title: "Three Units",
      faceValueNumericValue: 3,
      faceValueText: "3 Units",
      issuerId: spain.id,
      createdAt: new Date("2026-05-06T00:00:00.000Z"),
    })

    await expect(
      getCoins({
        minValue: 1,
        maxValue: 2,
      })
    ).resolves.toMatchObject([
      {
        id: middleMatch.id,
        title: "One and a Half Units",
        faceValue: {
          numericValue: 1.5,
        },
      },
      {
        id: lowerBoundMatch.id,
        title: "One Unit",
        faceValue: {
          numericValue: 1,
        },
      },
      {
        id: upperBoundMatch.id,
        title: "Two Units",
        faceValue: {
          numericValue: 2,
        },
      },
    ])
  })

  it("combines face value filtering with composition filters using AND semantics", async () => {
    const spain = await createIssuer({
      code: "spain",
      name: "Spain",
    })
    const silver900 = await createComposition({
      code: "silver-900",
      description: "Ninety percent silver alloy.",
      name: "Silver (.900)",
    })
    const copperNickel = await createComposition({
      code: "copper-nickel",
      description: "Copper-nickel alloy.",
      name: "Copper-nickel",
    })

    const matchingCoin = await createCoin({
      title: "Silver Two Unit Match",
      compositionId: silver900.id,
      faceValueNumericValue: 2,
      faceValueText: "2 Units",
      issuerId: spain.id,
      createdAt: new Date("2026-05-10T00:00:00.000Z"),
    })
    await createCoin({
      title: "Silver Half Unit",
      compositionId: silver900.id,
      faceValueNumericValue: 0.5,
      faceValueText: "Half Unit",
      issuerId: spain.id,
      createdAt: new Date("2026-05-09T00:00:00.000Z"),
    })
    await createCoin({
      title: "Copper Two Unit",
      compositionId: copperNickel.id,
      faceValueNumericValue: 2,
      faceValueText: "2 Units",
      issuerId: spain.id,
      createdAt: new Date("2026-05-08T00:00:00.000Z"),
    })

    await expect(
      getCoins({
        compositionCode: "silver-900",
        minValue: 1,
        maxValue: 2,
      })
    ).resolves.toMatchObject([
      {
        id: matchingCoin.id,
        title: "Silver Two Unit Match",
        composition: {
          code: "silver-900",
        },
        faceValue: {
          numericValue: 2,
        },
      },
    ])
  })

  it("combines measurement filtering with existing homepage filters using AND semantics and keeps newest-first ordering", async () => {
    const rome = await createIssuer({
      code: "rome",
      name: "Rome",
    })
    const athens = await createIssuer({
      code: "athens",
      name: "Athens",
    })
    const standardCirculation = await createDistribution({
      code: "standard-circulation",
      name: "Standard circulation",
    })
    const commemorative = await createDistribution({
      code: "commemorative",
      name: "Commemorative",
    })
    const romanImperialCoinage = await createCatalogue({
      code: "RIC",
      title: "Roman Imperial Coinage",
    })
    const augustus = await createRuler({
      code: "augustus",
      name: "Augustus",
    })

    const latestMatchingCoin = await createCoin({
      title: "Latest Matching Measured Coin",
      issuerId: rome.id,
      distributionId: standardCirculation.id,
      minYear: -5,
      maxYear: 5,
      weight: 4.5,
      diameter: 19.25,
      thickness: 1.75,
      createdAt: new Date("2026-05-06T00:00:00.000Z"),
    })
    const earlierMatchingCoin = await createCoin({
      title: "Earlier Matching Measured Coin",
      issuerId: rome.id,
      distributionId: standardCirculation.id,
      minYear: -5,
      maxYear: 5,
      weight: 4.75,
      diameter: 19.5,
      thickness: 1.8,
      createdAt: new Date("2026-05-05T00:00:00.000Z"),
    })
    const issuerMiss = await createCoin({
      title: "Issuer Miss",
      issuerId: athens.id,
      distributionId: standardCirculation.id,
      minYear: -5,
      maxYear: 5,
      weight: 4.5,
      diameter: 19.25,
      thickness: 1.75,
      createdAt: new Date("2026-05-04T00:00:00.000Z"),
    })
    const distributionMiss = await createCoin({
      title: "Distribution Miss",
      issuerId: rome.id,
      distributionId: commemorative.id,
      minYear: -5,
      maxYear: 5,
      weight: 4.5,
      diameter: 19.25,
      thickness: 1.75,
      createdAt: new Date("2026-05-03T00:00:00.000Z"),
    })
    const yearMiss = await createCoin({
      title: "Year Miss",
      issuerId: rome.id,
      distributionId: standardCirculation.id,
      minYear: 6,
      maxYear: 8,
      weight: 4.5,
      diameter: 19.25,
      thickness: 1.75,
      createdAt: new Date("2026-05-02T00:00:00.000Z"),
    })
    const measurementMiss = await createCoin({
      title: "Measurement Miss",
      issuerId: rome.id,
      distributionId: standardCirculation.id,
      minYear: -5,
      maxYear: 5,
      weight: 2.5,
      diameter: 17,
      thickness: 1.1,
      createdAt: new Date("2026-05-01T00:00:00.000Z"),
    })
    const referenceMiss = await createCoin({
      title: "Reference Miss",
      issuerId: rome.id,
      distributionId: standardCirculation.id,
      minYear: -5,
      maxYear: 5,
      weight: 4.5,
      diameter: 19.25,
      thickness: 1.75,
      createdAt: new Date("2026-04-30T00:00:00.000Z"),
    })
    const rulerMiss = await createCoin({
      title: "Ruler Miss",
      issuerId: rome.id,
      distributionId: standardCirculation.id,
      minYear: -5,
      maxYear: 5,
      weight: 4.5,
      diameter: 19.25,
      thickness: 1.75,
      createdAt: new Date("2026-04-29T00:00:00.000Z"),
    })

    await createCoinReference({
      coinId: latestMatchingCoin.id,
      catalogueId: romanImperialCoinage.id,
      number: "12A",
    })
    await createCoinReference({
      coinId: earlierMatchingCoin.id,
      catalogueId: romanImperialCoinage.id,
      number: "12B",
    })
    await createCoinReference({
      coinId: referenceMiss.id,
      catalogueId: romanImperialCoinage.id,
      number: "14A",
    })
    await createCoinRuler({
      coinId: latestMatchingCoin.id,
      rulerId: augustus.id,
      rulerOrder: 1,
    })
    await createCoinRuler({
      coinId: earlierMatchingCoin.id,
      rulerId: augustus.id,
      rulerOrder: 1,
    })
    await createCoinRuler({
      coinId: rulerMiss.id,
      rulerId: (await createRuler({
        code: "tiberius",
        name: "Tiberius",
      })).id,
      rulerOrder: 1,
    })

    await expect(
      getCoins({
        issuerCode: "rome",
        distributionCode: "standard-circulation",
        catalogueCode: "RIC",
        referenceNumber: "12",
        rulerCode: "augustus",
        fromYear: 0,
        toYear: 0,
        minWeight: 4,
        maxWeight: 5,
        minDiameter: 19,
        maxDiameter: 20,
        minThickness: 1.7,
        maxThickness: 2,
      })
    ).resolves.toSatisfy((coins: Array<{ title: string }>) =>
      coins.map(({ title }) => title).join("|") ===
      [
        "Latest Matching Measured Coin",
        "Earlier Matching Measured Coin",
      ].join("|")
    )
  })

  it("filters coins by a requested single issue year using overlap semantics and excludes unknown ranges", async () => {
    const rome = await createIssuer({
      code: "rome",
      name: "Rome",
    })

    await createCoin({
      title: "Exact Year Match",
      issuerId: rome.id,
      minYear: 1900,
      maxYear: 1900,
      createdAt: new Date("2026-05-06T00:00:00.000Z"),
    })
    await createCoin({
      title: "Overlapping Multi Year Match",
      issuerId: rome.id,
      minYear: 1898,
      maxYear: 1902,
      createdAt: new Date("2026-05-05T00:00:00.000Z"),
    })
    await createCoin({
      title: "Non Overlapping Range",
      issuerId: rome.id,
      minYear: 1901,
      maxYear: 1903,
      createdAt: new Date("2026-05-04T00:00:00.000Z"),
    })
    await createCoin({
      title: "Unknown Issue Years",
      issuerId: rome.id,
      createdAt: new Date("2026-05-03T00:00:00.000Z"),
    })

    await expect(
      getCoins({
        fromYear: 1900,
        toYear: 1900,
      })
    ).resolves.toSatisfy((coins: Array<{ title: string }>) =>
      coins.map(({ title }) => title).join("|") ===
      ["Exact Year Match", "Overlapping Multi Year Match"].join("|")
    )
  })

  it("filters coins by open-ended issue year bounds", async () => {
    const rome = await createIssuer({
      code: "rome",
      name: "Rome",
    })

    await createCoin({
      title: "Earlier Range",
      issuerId: rome.id,
      minYear: 1800,
      maxYear: 1850,
      createdAt: new Date("2026-05-06T00:00:00.000Z"),
    })
    await createCoin({
      title: "Later Range",
      issuerId: rome.id,
      minYear: 1900,
      maxYear: 1950,
      createdAt: new Date("2026-05-05T00:00:00.000Z"),
    })
    await createCoin({
      title: "Crossing Range",
      issuerId: rome.id,
      minYear: 1850,
      maxYear: 1905,
      createdAt: new Date("2026-05-04T00:00:00.000Z"),
    })

    await expect(
      getCoins({
        fromYear: 1900,
      })
    ).resolves.toSatisfy((coins: Array<{ title: string }>) =>
      coins.map(({ title }) => title).join("|") ===
      ["Later Range", "Crossing Range"].join("|")
    )

    await expect(
      getCoins({
        toYear: 1850,
      })
    ).resolves.toSatisfy((coins: Array<{ title: string }>) =>
      coins.map(({ title }) => title).join("|") ===
      ["Earlier Range", "Crossing Range"].join("|")
    )
  })

  it("filters issue year windows across astronomical years including negative years and 0", async () => {
    const rome = await createIssuer({
      code: "rome",
      name: "Rome",
    })

    await createCoin({
      title: "Late Republic Range",
      issuerId: rome.id,
      minYear: -43,
      maxYear: -40,
      createdAt: new Date("2026-05-06T00:00:00.000Z"),
    })
    await createCoin({
      title: "BCE To CE Transition Range",
      issuerId: rome.id,
      minYear: -2,
      maxYear: 1,
      createdAt: new Date("2026-05-05T00:00:00.000Z"),
    })
    await createCoin({
      title: "Early Empire Range",
      issuerId: rome.id,
      minYear: 5,
      maxYear: 10,
      createdAt: new Date("2026-05-04T00:00:00.000Z"),
    })
    await createCoin({
      title: "Unknown Issue Years",
      issuerId: rome.id,
      createdAt: new Date("2026-05-03T00:00:00.000Z"),
    })

    await expect(
      getCoins({
        fromYear: -1,
        toYear: 0,
      })
    ).resolves.toSatisfy((coins: Array<{ title: string }>) =>
      coins.map(({ title }) => title).join("|") ===
      ["BCE To CE Transition Range"].join("|")
    )

    await expect(
      getCoins({
        fromYear: 0,
      })
    ).resolves.toSatisfy((coins: Array<{ title: string }>) =>
      coins.map(({ title }) => title).join("|") ===
      ["BCE To CE Transition Range", "Early Empire Range"].join("|")
    )

    await expect(
      getCoins({
        toYear: -40,
      })
    ).resolves.toSatisfy((coins: Array<{ title: string }>) =>
      coins.map(({ title }) => title).join("|") ===
      ["Late Republic Range"].join("|")
    )
  })

  it("combines issue year range filtering with existing homepage filters using AND semantics", async () => {
    const spain = await createIssuer({
      code: "spain",
      name: "Spain",
    })
    const france = await createIssuer({
      code: "france",
      name: "France",
    })

    await createCoin({
      title: "Spanish Overlapping Match",
      issuerId: spain.id,
      minYear: 1898,
      maxYear: 1902,
      createdAt: new Date("2026-05-06T00:00:00.000Z"),
    })
    await createCoin({
      title: "Spanish Non Overlapping",
      issuerId: spain.id,
      minYear: 1903,
      maxYear: 1904,
      createdAt: new Date("2026-05-05T00:00:00.000Z"),
    })
    await createCoin({
      title: "French Overlapping",
      issuerId: france.id,
      minYear: 1898,
      maxYear: 1902,
      createdAt: new Date("2026-05-04T00:00:00.000Z"),
    })

    await expect(
      getCoins({
        fromYear: 1900,
        toYear: 1900,
        issuerCode: "spain",
      })
    ).resolves.toSatisfy((coins: Array<{ title: string }>) =>
      coins.map(({ title }) => title).join("|") ===
      ["Spanish Overlapping Match"].join("|")
    )
  })

  it("combines issue year range filtering with ruler filters using AND semantics", async () => {
    const rome = await createIssuer({
      code: "rome",
      name: "Rome",
    })
    const augustus = await createRuler({
      code: "augustus",
      name: "Augustus",
    })
    const tiberius = await createRuler({
      code: "tiberius",
      name: "Tiberius",
    })

    const augustusMatch = await createCoin({
      title: "Augustus Overlapping Match",
      issuerId: rome.id,
      minYear: -5,
      maxYear: 5,
      createdAt: new Date("2026-05-06T00:00:00.000Z"),
    })
    const augustusMiss = await createCoin({
      title: "Augustus Non Overlapping",
      issuerId: rome.id,
      minYear: 6,
      maxYear: 8,
      createdAt: new Date("2026-05-05T00:00:00.000Z"),
    })
    const tiberiusMatch = await createCoin({
      title: "Tiberius Overlapping",
      issuerId: rome.id,
      minYear: -5,
      maxYear: 5,
      createdAt: new Date("2026-05-04T00:00:00.000Z"),
    })

    await createCoinRuler({
      coinId: augustusMatch.id,
      rulerId: augustus.id,
      rulerOrder: 1,
    })
    await createCoinRuler({
      coinId: augustusMiss.id,
      rulerId: augustus.id,
      rulerOrder: 1,
    })
    await createCoinRuler({
      coinId: tiberiusMatch.id,
      rulerId: tiberius.id,
      rulerOrder: 1,
    })

    await expect(
      getCoins({
        fromYear: 0,
        toYear: 0,
        rulerCode: "augustus",
      })
    ).resolves.toSatisfy((coins: Array<{ title: string }>) =>
      coins.map(({ title }) => title).join("|") ===
      ["Augustus Overlapping Match"].join("|")
    )
  })

  it("combines issue year range filtering with distribution filters using AND semantics", async () => {
    const rome = await createIssuer({
      code: "rome",
      name: "Rome",
    })
    const standardCirculation = await createDistribution({
      code: "standard-circulation",
      name: "Standard circulation",
    })
    const commemorative = await createDistribution({
      code: "commemorative",
      name: "Commemorative",
    })

    await createCoin({
      title: "Circulation Overlapping Match",
      distributionId: standardCirculation.id,
      issuerId: rome.id,
      minYear: 1898,
      maxYear: 1902,
      createdAt: new Date("2026-05-06T00:00:00.000Z"),
    })
    await createCoin({
      title: "Circulation Non Overlapping",
      distributionId: standardCirculation.id,
      issuerId: rome.id,
      minYear: 1903,
      maxYear: 1904,
      createdAt: new Date("2026-05-05T00:00:00.000Z"),
    })
    await createCoin({
      title: "Commemorative Overlapping",
      distributionId: commemorative.id,
      issuerId: rome.id,
      minYear: 1898,
      maxYear: 1902,
      createdAt: new Date("2026-05-04T00:00:00.000Z"),
    })

    await expect(
      getCoins({
        fromYear: 1900,
        toYear: 1900,
        distributionCode: "standard-circulation",
      })
    ).resolves.toSatisfy((coins: Array<{ title: string }>) =>
      coins.map(({ title }) => title).join("|") ===
      ["Circulation Overlapping Match"].join("|")
    )
  })

  it("combines issue year range filtering with catalogue and reference number filters using AND semantics", async () => {
    const rome = await createIssuer({
      code: "rome",
      name: "Rome",
    })
    const romanImperialCoinage = await createCatalogue({
      code: "RIC",
      title: "Roman Imperial Coinage",
    })
    const standardCatalog = await createCatalogue({
      code: "KM",
      title: "Standard Catalog of World Coins",
    })

    const matchingRicCoin = await createCoin({
      title: "RIC Overlapping Match",
      issuerId: rome.id,
      minYear: 1898,
      maxYear: 1902,
      createdAt: new Date("2026-05-06T00:00:00.000Z"),
    })
    const nonMatchingYearRicCoin = await createCoin({
      title: "RIC Non Overlapping",
      issuerId: rome.id,
      minYear: 1903,
      maxYear: 1904,
      createdAt: new Date("2026-05-05T00:00:00.000Z"),
    })
    const matchingKmCoin = await createCoin({
      title: "KM Overlapping",
      issuerId: rome.id,
      minYear: 1898,
      maxYear: 1902,
      createdAt: new Date("2026-05-04T00:00:00.000Z"),
    })
    const referenceMatch = await createCoin({
      title: "Reference Overlapping Match",
      issuerId: rome.id,
      minYear: 1898,
      maxYear: 1902,
      createdAt: new Date("2026-05-03T00:00:00.000Z"),
    })
    const referenceMiss = await createCoin({
      title: "Reference Different Prefix",
      issuerId: rome.id,
      minYear: 1898,
      maxYear: 1902,
      createdAt: new Date("2026-05-02T00:00:00.000Z"),
    })

    await createCoinReference({
      coinId: matchingRicCoin.id,
      catalogueId: romanImperialCoinage.id,
      number: "12A",
    })
    await createCoinReference({
      coinId: nonMatchingYearRicCoin.id,
      catalogueId: romanImperialCoinage.id,
      number: "12B",
    })
    await createCoinReference({
      coinId: matchingKmCoin.id,
      catalogueId: standardCatalog.id,
      number: "12A",
    })
    await createCoinReference({
      coinId: referenceMatch.id,
      catalogueId: romanImperialCoinage.id,
      number: "1338A",
    })
    await createCoinReference({
      coinId: referenceMiss.id,
      catalogueId: romanImperialCoinage.id,
      number: "1444",
    })

    await expect(
      getCoins({
        catalogueCode: "RIC",
        fromYear: 1900,
        toYear: 1900,
      })
    ).resolves.toSatisfy((coins: Array<{ title: string }>) =>
      coins.map(({ title }) => title).join("|") ===
      [
        "RIC Overlapping Match",
        "Reference Overlapping Match",
        "Reference Different Prefix",
      ].join("|")
    )

    await expect(
      getCoins({
        fromYear: 1900,
        toYear: 1900,
        referenceNumber: "1338",
      })
    ).resolves.toSatisfy((coins: Array<{ title: string }>) =>
      coins.map(({ title }) => title).join("|") ===
      ["Reference Overlapping Match"].join("|")
    )
  })

  it("returns typed catalogue references sorted by catalogue title", async () => {
    const spain = await createIssuer({
      code: "spain",
      name: "Spain",
    })
    const standardCirculation = await createDistribution({
      code: "standard-circulation",
      name: "Standard circulation",
    })
    const standardCatalog = await createCatalogue({
      code: "KM",
      title: "Standard Catalog of World Coins",
    })
    const romanImperialCoinage = await createCatalogue({
      code: "RIC",
      title: "Roman Imperial Coinage",
    })
    const createdAt = new Date("2026-05-01T00:00:00.000Z")
    const coin = await createCoin({
      title: "Catalogue Reference Test Issue",
      distributionId: standardCirculation.id,
      issuerId: spain.id,
      createdAt,
    })

    const romanReference = await createCoinReference({
      coinId: coin.id,
      catalogueId: romanImperialCoinage.id,
      number: "K-12",
    })
    const kmReference = await createCoinReference({
      coinId: coin.id,
      catalogueId: standardCatalog.id,
      number: "1338A",
    })

    await expect(getCoins({ limit: 1 })).resolves.toStrictEqual([
      {
        id: coin.id,
        title: "Catalogue Reference Test Issue",
        createdAt,
        updatedAt: createdAt,
        comments: null,
        mintage: null,
        issueYearRange: null,
        faceValue: {
          text: "1 Test Unit",
          numericValue: 1,
          currency: {
            id: expect.any(String),
            code: "test-unit",
            name: "Test Unit",
            fullName: "Test Unit",
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
          },
        },
        measurements: {
          weight: null,
          diameter: null,
          thickness: null,
        },
        composition: {
          id: expect.any(String),
          code: "copper-nickel",
          name: "Copper-nickel",
          description: null,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
        distribution: {
          id: standardCirculation.id,
          code: "standard-circulation",
          name: "Standard circulation",
          createdAt: standardCirculation.createdAt,
          updatedAt: standardCirculation.updatedAt,
        },
        issuer: {
          id: spain.id,
          code: "spain",
          name: "Spain",
          createdAt: spain.createdAt,
          updatedAt: spain.updatedAt,
          parent: null,
        },
        mints: [],
        rulers: [],
        references: [
          {
            id: romanReference.id,
            type: "catalogue",
            number: "K-12",
            createdAt: romanReference.createdAt,
            updatedAt: romanReference.updatedAt,
            catalogue: {
              id: romanImperialCoinage.id,
              code: "RIC",
              title: "Roman Imperial Coinage",
              createdAt: romanImperialCoinage.createdAt,
              updatedAt: romanImperialCoinage.updatedAt,
            },
          },
          {
            id: kmReference.id,
            type: "catalogue",
            number: "1338A",
            createdAt: kmReference.createdAt,
            updatedAt: kmReference.updatedAt,
            catalogue: {
              id: standardCatalog.id,
              code: "KM",
              title: "Standard Catalog of World Coins",
              createdAt: standardCatalog.createdAt,
              updatedAt: standardCatalog.updatedAt,
            },
          },
        ],
      },
    ])
  })

  it("filters coins by catalogue code and reference number prefix using the same matching reference", async () => {
    const spain = await createIssuer({
      code: "spain",
      name: "Spain",
    })
    const france = await createIssuer({
      code: "france",
      name: "France",
    })
    const standardCatalog = await createCatalogue({
      code: "KM",
      title: "Standard Catalog of World Coins",
    })
    const romanImperialCoinage = await createCatalogue({
      code: "RIC",
      title: "Roman Imperial Coinage",
    })

    const matchingCoin = await createCoin({
      title: "Spanish Matching KM Issue",
      issuerId: spain.id,
      createdAt: new Date("2026-05-06T00:00:00.000Z"),
    })
    const referenceOnlyMatchCoin = await createCoin({
      title: "French Reference Prefix Match",
      issuerId: france.id,
      createdAt: new Date("2026-05-05T00:00:00.000Z"),
    })
    const catalogueOnlyMatchCoin = await createCoin({
      title: "Spanish KM Other Number",
      issuerId: spain.id,
      createdAt: new Date("2026-05-04T00:00:00.000Z"),
    })
    const splitMatchCoin = await createCoin({
      title: "Split Reference Coin",
      issuerId: spain.id,
      createdAt: new Date("2026-05-03T00:00:00.000Z"),
    })
    const nonPrefixCoin = await createCoin({
      title: "Non Prefix Number Coin",
      issuerId: france.id,
      createdAt: new Date("2026-05-02T00:00:00.000Z"),
    })

    await createCoinReference({
      coinId: matchingCoin.id,
      catalogueId: standardCatalog.id,
      number: "  1338 A ",
    })
    await createCoinReference({
      coinId: referenceOnlyMatchCoin.id,
      catalogueId: romanImperialCoinage.id,
      number: "1338b",
    })
    await createCoinReference({
      coinId: catalogueOnlyMatchCoin.id,
      catalogueId: standardCatalog.id,
      number: "1400",
    })
    await createCoinReference({
      coinId: splitMatchCoin.id,
      catalogueId: standardCatalog.id,
      number: "2000",
    })
    await createCoinReference({
      coinId: splitMatchCoin.id,
      catalogueId: romanImperialCoinage.id,
      number: "1338c",
    })
    await createCoinReference({
      coinId: nonPrefixCoin.id,
      catalogueId: romanImperialCoinage.id,
      number: "21338",
    })

    await expect(getCoins({ catalogueCode: "km" })).resolves.toSatisfy(
      (coins: Array<{ title: string }>) =>
        coins.map(({ title }) => title).join("|") ===
        [
          "Spanish Matching KM Issue",
          "Spanish KM Other Number",
          "Split Reference Coin",
        ].join("|")
    )

    await expect(
      getCoins({
        referenceNumber: "1338 a",
      })
    ).resolves.toSatisfy(
      (coins: Array<{ title: string }>) =>
        coins.map(({ title }) => title).join("|") ===
        ["Spanish Matching KM Issue"].join("|")
    )

    await expect(
      getCoins({
        referenceNumber: "1338",
      })
    ).resolves.toSatisfy(
      (coins: Array<{ title: string }>) =>
        coins.map(({ title }) => title).join("|") ===
        [
          "Spanish Matching KM Issue",
          "French Reference Prefix Match",
          "Split Reference Coin",
        ].join("|")
    )

    await expect(
      getCoins({
        catalogueCode: "km",
        referenceNumber: "1338 a",
      })
    ).resolves.toSatisfy(
      (coins: Array<{ title: string }>) =>
        coins.map(({ title }) => title).join("|") ===
        ["Spanish Matching KM Issue"].join("|")
    )
  })

  it("filters coins by exact distribution code and composes with issuer, ruler, catalogue, and reference number filters", async () => {
    const spain = await createIssuer({
      code: "spain",
      name: "Spain",
    })
    const france = await createIssuer({
      code: "france",
      name: "France",
    })
    const standardCirculation = await createDistribution({
      code: "standard-circulation",
      name: "Standard circulation",
    })
    const circulatingCommemorative = await createDistribution({
      code: "circulating-commemorative",
      name: "Circulating commemorative",
    })
    const standardCatalog = await createCatalogue({
      code: "KM",
      title: "Standard Catalog of World Coins",
    })
    const felipe = await createRuler({
      code: "felipe-vi",
      name: "Felipe VI",
    })

    const matchingCoin = await createCoin({
      title: "Spanish Circulating Commemorative Match",
      distributionId: circulatingCommemorative.id,
      issuerId: spain.id,
      createdAt: new Date("2026-05-10T00:00:00.000Z"),
    })
    const wrongDistributionCoin = await createCoin({
      title: "Spanish Standard Circulation",
      distributionId: standardCirculation.id,
      issuerId: spain.id,
      createdAt: new Date("2026-05-09T00:00:00.000Z"),
    })
    const wrongIssuerCoin = await createCoin({
      title: "French Circulating Commemorative",
      distributionId: circulatingCommemorative.id,
      issuerId: france.id,
      createdAt: new Date("2026-05-08T00:00:00.000Z"),
    })
    const wrongRulerCoin = await createCoin({
      title: "Spanish Commemorative Without Ruler",
      distributionId: circulatingCommemorative.id,
      issuerId: spain.id,
      createdAt: new Date("2026-05-07T00:00:00.000Z"),
    })
    const wrongReferenceCoin = await createCoin({
      title: "Spanish Commemorative Wrong Reference",
      distributionId: circulatingCommemorative.id,
      issuerId: spain.id,
      createdAt: new Date("2026-05-06T00:00:00.000Z"),
    })

    await createCoinRuler({
      coinId: matchingCoin.id,
      rulerId: felipe.id,
      rulerOrder: 1,
    })
    await createCoinRuler({
      coinId: wrongDistributionCoin.id,
      rulerId: felipe.id,
      rulerOrder: 1,
    })

    await createCoinReference({
      coinId: matchingCoin.id,
      catalogueId: standardCatalog.id,
      number: "1338A",
    })
    await createCoinReference({
      coinId: wrongDistributionCoin.id,
      catalogueId: standardCatalog.id,
      number: "1338A",
    })
    await createCoinReference({
      coinId: wrongIssuerCoin.id,
      catalogueId: standardCatalog.id,
      number: "1338A",
    })
    await createCoinReference({
      coinId: wrongRulerCoin.id,
      catalogueId: standardCatalog.id,
      number: "1338A",
    })
    await createCoinReference({
      coinId: wrongReferenceCoin.id,
      catalogueId: standardCatalog.id,
      number: "2000",
    })

    await expect(
      getCoins({
        distributionCode: "circulating-commemorative",
      })
    ).resolves.toSatisfy((coins: Array<{ title: string }>) =>
      coins.map(({ title }) => title).join("|") ===
      [
        "Spanish Circulating Commemorative Match",
        "French Circulating Commemorative",
        "Spanish Commemorative Without Ruler",
        "Spanish Commemorative Wrong Reference",
      ].join("|")
    )

    await expect(
      getCoins({
        distributionCode: "circulating-commemorative",
        issuerCode: "spain",
        rulerCode: "felipe-vi",
        catalogueCode: "km",
        referenceNumber: "1338",
      })
    ).resolves.toSatisfy((coins: Array<{ title: string }>) =>
      coins.map(({ title }) => title).join("|") ===
      ["Spanish Circulating Commemorative Match"].join("|")
    )
  })

  it("ignores a blank distribution code filter instead of returning an empty result set", async () => {
    const spain = await createIssuer({
      code: "spain",
      name: "Spain",
    })
    const france = await createIssuer({
      code: "france",
      name: "France",
    })

    await createCoin({
      title: "Spanish Standard Issue",
      issuerId: spain.id,
      createdAt: new Date("2026-05-11T00:00:00.000Z"),
    })
    await createCoin({
      title: "French Standard Issue",
      issuerId: france.id,
      createdAt: new Date("2026-05-10T00:00:00.000Z"),
    })

    await expect(
      getCoins({
        distributionCode: "   ",
      })
    ).resolves.toMatchObject([
      { title: "Spanish Standard Issue" },
      { title: "French Standard Issue" },
    ])
  })

  it("filters coins by exact composition code and combines the composition filter with existing filters using AND semantics", async () => {
    const spain = await createIssuer({
      code: "spain",
      name: "Spain",
    })
    const france = await createIssuer({
      code: "france",
      name: "France",
    })
    const silver900 = await createComposition({
      code: "silver-900",
      description: "Ninety percent silver alloy.",
      name: "Silver (.900)",
    })
    const copperNickel = await createComposition({
      code: "copper-nickel",
      name: "Copper-nickel",
    })
    const circulatingCommemorative = await createDistribution({
      code: "circulating-commemorative",
      name: "Circulating commemorative",
    })

    await createCoin({
      title: "Spanish Silver Match",
      compositionId: silver900.id,
      distributionId: circulatingCommemorative.id,
      issuerId: spain.id,
      createdAt: new Date("2026-05-11T00:00:00.000Z"),
    })
    await createCoin({
      title: "French Silver Coin",
      compositionId: silver900.id,
      distributionId: circulatingCommemorative.id,
      issuerId: france.id,
      createdAt: new Date("2026-05-10T00:00:00.000Z"),
    })
    await createCoin({
      title: "Spanish Copper-Nickel Coin",
      compositionId: copperNickel.id,
      distributionId: circulatingCommemorative.id,
      issuerId: spain.id,
      createdAt: new Date("2026-05-09T00:00:00.000Z"),
    })

    await expect(
      getCoins({
        compositionCode: "SILVER-900",
      })
    ).resolves.toSatisfy((coins: Array<{ title: string }>) =>
      coins.map(({ title }) => title).join("|") ===
      ["Spanish Silver Match", "French Silver Coin"].join("|")
    )

    await expect(
      getCoins({
        compositionCode: "silver-900",
        distributionCode: "circulating-commemorative",
        issuerCode: "spain",
      })
    ).resolves.toSatisfy((coins: Array<{ title: string }>) =>
      coins.map(({ title }) => title).join("|") ===
      ["Spanish Silver Match"].join("|")
    )
  })

  it("filters coins by exact currency code and combines the currency filter with existing filters using AND semantics", async () => {
    const spain = await createIssuer({
      code: "spain",
      name: "Spain",
    })
    const france = await createIssuer({
      code: "france",
      name: "France",
    })
    const euro = await createCurrency({
      code: "euro",
      fullName: "Euro (2002-date)",
      name: "Euro",
    })
    const unitedStatesDollar = await createCurrency({
      code: "united-states-dollar",
      fullName: "United States dollar",
      name: "United States dollar",
    })
    const silver900 = await createComposition({
      code: "silver-900",
      description: "Ninety percent silver alloy.",
      name: "Silver (.900)",
    })
    const copperNickel = await createComposition({
      code: "copper-nickel",
      name: "Copper-nickel",
    })

    await createCoin({
      title: "Spanish Euro Silver Match",
      compositionId: silver900.id,
      currencyId: euro.id,
      issuerId: spain.id,
      createdAt: new Date("2026-05-11T00:00:00.000Z"),
    })
    await createCoin({
      title: "French Euro Coin",
      compositionId: silver900.id,
      currencyId: euro.id,
      issuerId: france.id,
      createdAt: new Date("2026-05-10T00:00:00.000Z"),
    })
    await createCoin({
      title: "Spanish Dollar Coin",
      compositionId: silver900.id,
      currencyId: unitedStatesDollar.id,
      issuerId: spain.id,
      createdAt: new Date("2026-05-09T00:00:00.000Z"),
    })
    await createCoin({
      title: "Spanish Euro Copper-Nickel Coin",
      compositionId: copperNickel.id,
      currencyId: euro.id,
      issuerId: spain.id,
      createdAt: new Date("2026-05-08T00:00:00.000Z"),
    })

    await expect(
      getCoins({
        currencyCode: "EURO",
      })
    ).resolves.toSatisfy((coins: Array<{ title: string }>) =>
      coins.map(({ title }) => title).join("|") ===
      [
        "Spanish Euro Silver Match",
        "French Euro Coin",
        "Spanish Euro Copper-Nickel Coin",
      ].join("|")
    )

    await expect(
      getCoins({
        compositionCode: "silver-900",
        currencyCode: "euro",
        issuerCode: "spain",
      })
    ).resolves.toSatisfy((coins: Array<{ title: string }>) =>
      coins.map(({ title }) => title).join("|") ===
      ["Spanish Euro Silver Match"].join("|")
    )
  })

  it("returns full linked ruler data in ruler attribution order", async () => {
    const spain = await createIssuer({
      code: "spain",
      name: "Spain",
    })
    const standardCirculation = await createDistribution({
      code: "standard-circulation",
      name: "Standard circulation",
    })
    const bourbon = await createRulerGroup({
      code: "house-of-bourbon",
      name: "House of Bourbon",
    })
    const juanCarlos = await createRuler({
      code: "juan-carlos-i",
      name: "Juan Carlos I",
      rulerGroupId: bourbon.id,
    })
    const felipe = await createRuler({
      code: "felipe-vi",
      name: "Felipe VI",
      rulerGroupId: bourbon.id,
    })
    const liberty = await createRuler({
      code: "liberty",
      name: "Liberty",
    })
    const createdAt = new Date("2026-05-02T00:00:00.000Z")
    const coin = await createCoin({
      title: "Attribution Test Issue",
      distributionId: standardCirculation.id,
      issuerId: spain.id,
      createdAt,
    })

    await createCoinRuler({
      coinId: coin.id,
      rulerId: felipe.id,
      rulerOrder: 2,
    })
    await createCoinRuler({
      coinId: coin.id,
      rulerId: juanCarlos.id,
      rulerOrder: 1,
    })
    await createCoinRuler({
      coinId: coin.id,
      rulerId: liberty.id,
      rulerOrder: 3,
    })

    await expect(getCoins({ limit: 1 })).resolves.toStrictEqual([
      {
        id: coin.id,
        title: "Attribution Test Issue",
        createdAt,
        updatedAt: createdAt,
        comments: null,
        mintage: null,
        issueYearRange: null,
        faceValue: {
          text: "1 Test Unit",
          numericValue: 1,
          currency: {
            id: expect.any(String),
            code: "test-unit",
            name: "Test Unit",
            fullName: "Test Unit",
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
          },
        },
        measurements: {
          weight: null,
          diameter: null,
          thickness: null,
        },
        composition: {
          id: expect.any(String),
          code: "copper-nickel",
          name: "Copper-nickel",
          description: null,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
        distribution: {
          id: standardCirculation.id,
          code: "standard-circulation",
          name: "Standard circulation",
          createdAt: standardCirculation.createdAt,
          updatedAt: standardCirculation.updatedAt,
        },
        issuer: {
          id: spain.id,
          code: "spain",
          name: "Spain",
          createdAt: spain.createdAt,
          updatedAt: spain.updatedAt,
          parent: null,
        },
        mints: [],
        references: [],
        rulers: [
          {
            id: juanCarlos.id,
            code: "juan-carlos-i",
            name: "Juan Carlos I",
            createdAt: juanCarlos.createdAt,
            updatedAt: juanCarlos.updatedAt,
            group: {
              id: bourbon.id,
              code: "house-of-bourbon",
              name: "House of Bourbon",
              createdAt: bourbon.createdAt,
              updatedAt: bourbon.updatedAt,
            },
          },
          {
            id: felipe.id,
            code: "felipe-vi",
            name: "Felipe VI",
            createdAt: felipe.createdAt,
            updatedAt: felipe.updatedAt,
            group: {
              id: bourbon.id,
              code: "house-of-bourbon",
              name: "House of Bourbon",
              createdAt: bourbon.createdAt,
              updatedAt: bourbon.updatedAt,
            },
          },
          {
            id: liberty.id,
            code: "liberty",
            name: "Liberty",
            createdAt: liberty.createdAt,
            updatedAt: liberty.updatedAt,
            group: null,
          },
        ],
      },
    ])
  })

  it("filters coins by exact ruler and combines issuer and ruler filters with AND semantics", async () => {
    const spain = await createIssuer({
      code: "spain",
      name: "Spain",
    })
    const france = await createIssuer({
      code: "france",
      name: "France",
    })
    const bourbon = await createRulerGroup({
      code: "house-of-bourbon",
      name: "House of Bourbon",
    })
    const felipe = await createRuler({
      code: "felipe-vi",
      name: "Felipe VI",
      rulerGroupId: bourbon.id,
    })
    const juanCarlos = await createRuler({
      code: "juan-carlos-i",
      name: "Juan Carlos I",
      rulerGroupId: bourbon.id,
    })
    const louis = await createRuler({
      code: "louis-xiv",
      name: "Louis XIV",
      rulerGroupId: bourbon.id,
    })

    const spanishFelipeCoin = await createCoin({
      title: "Spanish Felipe Issue",
      issuerId: spain.id,
      createdAt: new Date("2026-05-05T00:00:00.000Z"),
    })
    const spanishJuanCarlosCoin = await createCoin({
      title: "Spanish Juan Carlos Issue",
      issuerId: spain.id,
      createdAt: new Date("2026-05-04T00:00:00.000Z"),
    })
    const frenchLouisCoin = await createCoin({
      title: "French Louis Issue",
      issuerId: france.id,
      createdAt: new Date("2026-05-03T00:00:00.000Z"),
    })

    await createCoinRuler({
      coinId: spanishFelipeCoin.id,
      rulerId: felipe.id,
      rulerOrder: 1,
    })
    await createCoinRuler({
      coinId: spanishJuanCarlosCoin.id,
      rulerId: juanCarlos.id,
      rulerOrder: 1,
    })
    await createCoinRuler({
      coinId: frenchLouisCoin.id,
      rulerId: louis.id,
      rulerOrder: 1,
    })

    await expect(getCoins({ rulerCode: "felipe-vi" })).resolves.toMatchObject([
      {
        title: "Spanish Felipe Issue",
        issuer: {
          code: "spain",
        },
        rulers: [
          {
            code: "felipe-vi",
          },
        ],
      },
    ])

    await expect(
      getCoins({
        issuerCode: "spain",
        rulerCode: "felipe-vi",
      })
    ).resolves.toMatchObject([
      {
        title: "Spanish Felipe Issue",
      },
    ])

    await expect(
      getCoins({
        issuerCode: "france",
        rulerCode: "felipe-vi",
      })
    ).resolves.toStrictEqual([])

    await expect(
      getCoins({
        rulerCode: "unknown-ruler",
      })
    ).resolves.toStrictEqual([])
  })

  it("returns all ordered ruler attributions for a coin filtered by one matching ruler", async () => {
    const spain = await createIssuer({
      code: "spain",
      name: "Spain",
    })
    const bourbon = await createRulerGroup({
      code: "house-of-bourbon",
      name: "House of Bourbon",
    })
    const juanCarlos = await createRuler({
      code: "juan-carlos-i",
      name: "Juan Carlos I",
      rulerGroupId: bourbon.id,
    })
    const felipe = await createRuler({
      code: "felipe-vi",
      name: "Felipe VI",
      rulerGroupId: bourbon.id,
    })
    const coin = await createCoin({
      title: "Spanish Transitional Issue",
      issuerId: spain.id,
      createdAt: new Date("2026-05-06T00:00:00.000Z"),
    })

    await createCoinRuler({
      coinId: coin.id,
      rulerId: felipe.id,
      rulerOrder: 2,
    })
    await createCoinRuler({
      coinId: coin.id,
      rulerId: juanCarlos.id,
      rulerOrder: 1,
    })

    await expect(getCoins({ rulerCode: "felipe-vi" })).resolves.toMatchObject([
      {
        title: "Spanish Transitional Issue",
        rulers: [
          {
            code: "juan-carlos-i",
          },
          {
            code: "felipe-vi",
          },
        ],
      },
    ])
  })

  it("composes catalogue reference filters with issuer and ruler filters", async () => {
    const spain = await createIssuer({
      code: "spain",
      name: "Spain",
    })
    const france = await createIssuer({
      code: "france",
      name: "France",
    })
    const standardCatalog = await createCatalogue({
      code: "KM",
      title: "Standard Catalog of World Coins",
    })
    const bourbon = await createRulerGroup({
      code: "house-of-bourbon",
      name: "House of Bourbon",
    })
    const felipe = await createRuler({
      code: "felipe-vi",
      name: "Felipe VI",
      rulerGroupId: bourbon.id,
    })
    const louis = await createRuler({
      code: "louis-xiv",
      name: "Louis XIV",
      rulerGroupId: bourbon.id,
    })

    const matchingCoin = await createCoin({
      title: "Spanish Felipe KM 1338",
      issuerId: spain.id,
      createdAt: new Date("2026-05-07T00:00:00.000Z"),
    })
    const wrongIssuerCoin = await createCoin({
      title: "French Felipe KM 1338",
      issuerId: france.id,
      createdAt: new Date("2026-05-06T00:00:00.000Z"),
    })
    const wrongRulerCoin = await createCoin({
      title: "Spanish Louis KM 1338",
      issuerId: spain.id,
      createdAt: new Date("2026-05-05T00:00:00.000Z"),
    })

    await createCoinRuler({
      coinId: matchingCoin.id,
      rulerId: felipe.id,
      rulerOrder: 1,
    })
    await createCoinRuler({
      coinId: wrongIssuerCoin.id,
      rulerId: felipe.id,
      rulerOrder: 1,
    })
    await createCoinRuler({
      coinId: wrongRulerCoin.id,
      rulerId: louis.id,
      rulerOrder: 1,
    })

    await createCoinReference({
      coinId: matchingCoin.id,
      catalogueId: standardCatalog.id,
      number: "1338A",
    })
    await createCoinReference({
      coinId: wrongIssuerCoin.id,
      catalogueId: standardCatalog.id,
      number: "1338B",
    })
    await createCoinReference({
      coinId: wrongRulerCoin.id,
      catalogueId: standardCatalog.id,
      number: "1338C",
    })

    await expect(
      getCoins({
        catalogueCode: "km",
        issuerCode: "spain",
        referenceNumber: "1338",
        rulerCode: "felipe-vi",
      })
    ).resolves.toSatisfy(
      (coins: Array<{ title: string }>) =>
        coins.map(({ title }) => title).join("|") ===
        ["Spanish Felipe KM 1338"].join("|")
    )
  })

  it("returns the required nested distribution for each coin", async () => {
    const spain = await createIssuer({
      code: "spain",
      name: "Spain",
    })
    const standardCirculation = await createDistribution({
      code: "standard-circulation",
      name: "Standard circulation",
    })
    const createdAt = new Date("2026-05-01T00:00:00.000Z")
    const coin = await createCoin({
      title: "Distribution Test Issue",
      issuerId: spain.id,
      distributionId: standardCirculation.id,
      createdAt,
    })

    await expect(getCoins({ limit: 1 })).resolves.toStrictEqual([
      {
        id: coin.id,
        title: "Distribution Test Issue",
        createdAt,
        updatedAt: createdAt,
        comments: null,
        mintage: null,
        issueYearRange: null,
        faceValue: {
          text: "1 Test Unit",
          numericValue: 1,
          currency: {
            id: expect.any(String),
            code: "test-unit",
            name: "Test Unit",
            fullName: "Test Unit",
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
          },
        },
        measurements: {
          weight: null,
          diameter: null,
          thickness: null,
        },
        composition: {
          id: expect.any(String),
          code: "copper-nickel",
          name: "Copper-nickel",
          description: null,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
        distribution: {
          id: standardCirculation.id,
          code: "standard-circulation",
          name: "Standard circulation",
          createdAt: standardCirculation.createdAt,
          updatedAt: standardCirculation.updatedAt,
        },
        issuer: {
          id: spain.id,
          code: "spain",
          name: "Spain",
          createdAt: spain.createdAt,
          updatedAt: spain.updatedAt,
          parent: null,
        },
        mints: [],
        references: [],
        rulers: [],
      },
    ])
  })
})
