import { pathToFileURL } from "node:url"
import { eq, inArray, sql } from "drizzle-orm"
import { closeDb, db } from "../client"
import { normalizeCoinComments } from "../normalize-coin-comments"
import { catalogue } from "../schema/catalogue"
import { coin } from "../schema/coin"
import { coinFace } from "../schema/coin-face"
import type { CoinFaceSide } from "../schema/coin-face"
import { coinFaceEngraver } from "../schema/coin-face-engraver"
import { coinMint } from "../schema/coin-mint"
import { coinReference } from "../schema/coin-reference"
import { coinRuler } from "../schema/coin-ruler"
import { coinTheme } from "../schema/coin-theme"
import { composition } from "../schema/composition"
import { currency } from "../schema/currency"
import { distribution } from "../schema/distribution"
import { edge } from "../schema/edge"
import { engraver } from "../schema/engraver"
import { issuer } from "../schema/issuer"
import { mint } from "../schema/mint"
import { orientation } from "../schema/orientation"
import { rim } from "../schema/rim"
import { ruler } from "../schema/ruler"
import { rulerGroup } from "../schema/ruler-group"
import { shape } from "../schema/shape"
import { technique } from "../schema/technique"
import { theme } from "../schema/theme"
import {
  seededCatalogues,
  seededCoinFaces,
  seededCoinFaceEngravers,
  seededCoinReferences,
  seededCoinMints,
  seededCoinRulers,
  seededCoinThemes,
  seededCoins,
  seededCompositions,
  seededCurrencies,
  seededDistributions,
  seededEdges,
  seededEngravers,
  seededIssuers,
  seededMints,
  seededOrientations,
  seededRims,
  seededRulerGroups,
  seededRulers,
  seededShapes,
  seededTechniques,
  seededThemes,
} from "./seed-data"

type CatalogueIdsByCode = Map<string, string>
type CompositionIdsByCode = Map<string, string>
type CurrencyIdsByCode = Map<string, string>
type DistributionIdsByCode = Map<string, string>
type EdgeIdsByCode = Map<string, string>
type EngraverIdsByCode = Map<string, string>
type IssuerIdsByCode = Map<string, string>
type MintIdsByCode = Map<string, string>
type OrientationIdsByCode = Map<string, string>
type RimIdsByCode = Map<string, string>
type RulerGroupIdsByCode = Map<string, string>
type RulerIdsByCode = Map<string, string>
type CoinIdsByTitle = Map<string, string>
type ShapeIdsByCode = Map<string, string>
type TechniqueIdsByCode = Map<string, string>
type ThemeIdsByCode = Map<string, string>
type CoinFaceIdsByKey = Map<string, string>

function getRequiredSeededId(
  idsByKey: Map<string, string>,
  key: string,
  entityName: string
) {
  const id = idsByKey.get(key)

  if (!id) {
    throw new Error(`Missing seeded ${entityName} ID for ${key}`)
  }

  return id
}

function getCoinFaceSeedKey(coinTitle: string, side: CoinFaceSide) {
  return `${coinTitle}:${side}`
}

async function deleteSeededRecords(
  values: readonly string[],
  deleteRecord: (value: string) => Promise<unknown>
) {
  for (const value of [...values].reverse()) {
    await deleteRecord(value)
  }
}

async function seedRecordsByCode<TSeededRecord extends { code: string }>(
  seededRecords: readonly TSeededRecord[],
  deleteSeeded: () => Promise<void>,
  insertSeededRecord: (seededRecord: TSeededRecord) => Promise<string>
) {
  const idsByCode = new Map<string, string>()

  await deleteSeeded()

  for (const seededRecord of seededRecords) {
    const insertedId = await insertSeededRecord(seededRecord)
    idsByCode.set(seededRecord.code, insertedId)
  }

  return idsByCode
}

async function deleteSeededCatalogues() {
  await deleteSeededRecords(
    seededCatalogues.map(({ code }) => code),
    (code) => db.delete(catalogue).where(eq(catalogue.code, code))
  )
}

async function deleteSeededCompositions() {
  await deleteSeededRecords(
    seededCompositions.map(({ code }) => code),
    (code) => db.delete(composition).where(eq(composition.code, code))
  )
}

async function deleteSeededCurrencies() {
  await deleteSeededRecords(
    seededCurrencies.map(({ code }) => code),
    (code) => db.delete(currency).where(eq(currency.code, code))
  )
}

async function deleteSeededEdges() {
  await deleteSeededRecords(
    seededEdges.map(({ code }) => code),
    (code) => db.delete(edge).where(eq(edge.code, code))
  )
}

async function deleteSeededEngravers() {
  await deleteSeededRecords(
    seededEngravers.map(({ code }) => code),
    (code) => db.delete(engraver).where(eq(engraver.code, code))
  )
}

async function deleteSeededIssuers() {
  await deleteSeededRecords(
    seededIssuers.map(({ code }) => code),
    (code) => db.delete(issuer).where(eq(issuer.code, code))
  )
}

async function deleteSeededMints() {
  await deleteSeededRecords(
    seededMints.map(({ code }) => code),
    (code) => db.delete(mint).where(eq(mint.code, code))
  )
}

async function deleteSeededOrientations() {
  await deleteSeededRecords(
    seededOrientations.map(({ code }) => code),
    (code) => db.delete(orientation).where(eq(orientation.code, code))
  )
}

async function deleteSeededRims() {
  await deleteSeededRecords(
    seededRims.map(({ code }) => code),
    (code) => db.delete(rim).where(eq(rim.code, code))
  )
}

async function deleteSeededRulers() {
  await deleteSeededRecords(
    seededRulers.map(({ code }) => code),
    (code) => db.delete(ruler).where(eq(ruler.code, code))
  )
}

async function deleteSeededRulerGroups() {
  await deleteSeededRecords(
    seededRulerGroups.map(({ code }) => code),
    (code) => db.delete(rulerGroup).where(eq(rulerGroup.code, code))
  )
}

async function deleteSeededCoins() {
  await deleteSeededRecords(
    seededCoins.map(({ title }) => title),
    (title) => db.delete(coin).where(eq(coin.title, title))
  )
}

async function deleteSeededThemes() {
  await deleteSeededRecords(
    seededThemes.map(({ code }) => code),
    (code) => db.delete(theme).where(eq(theme.code, code))
  )
}

async function deleteSeededTechniques() {
  await deleteSeededRecords(
    seededTechniques.map(({ code }) => code),
    (code) => db.delete(technique).where(eq(technique.code, code))
  )
}

async function deleteSeededShapes() {
  await deleteSeededRecords(
    seededShapes.map(({ code }) => code),
    (code) => db.delete(shape).where(eq(shape.code, code))
  )
}

async function seedRulerGroups() {
  const rulerGroupIdsByCode: RulerGroupIdsByCode = new Map()

  await deleteSeededRulerGroups()

  for (const seededRulerGroup of seededRulerGroups) {
    const [insertedRulerGroup] = await db
      .insert(rulerGroup)
      .values(seededRulerGroup)
      .returning({ id: rulerGroup.id })

    rulerGroupIdsByCode.set(seededRulerGroup.code, insertedRulerGroup.id)
  }

  return rulerGroupIdsByCode
}

async function seedRulers() {
  const rulerIdsByCode: RulerIdsByCode = new Map()

  await deleteSeededRulers()
  const rulerGroupIdsByCode = await seedRulerGroups()

  for (const seededRuler of seededRulers) {
    const { rulerGroupCode, ...seededRulerValues } = seededRuler

    const [insertedRuler] = await db
      .insert(ruler)
      .values({
        ...seededRulerValues,
        rulerGroupId: rulerGroupCode
          ? getRequiredSeededId(
              rulerGroupIdsByCode,
              rulerGroupCode,
              "ruler group"
            )
          : undefined,
      })
      .returning({ id: ruler.id })

    rulerIdsByCode.set(seededRuler.code, insertedRuler.id)
  }

  return rulerIdsByCode
}

async function seedCatalogues() {
  const catalogueIdsByCode: CatalogueIdsByCode = new Map()

  await deleteSeededCatalogues()

  for (const seededCatalogue of seededCatalogues) {
    const [insertedCatalogue] = await db
      .insert(catalogue)
      .values(seededCatalogue)
      .returning({ id: catalogue.id })

    catalogueIdsByCode.set(seededCatalogue.code, insertedCatalogue.id)
  }

  return catalogueIdsByCode
}

async function seedCompositions(): Promise<CompositionIdsByCode> {
  return seedRecordsByCode(
    seededCompositions,
    deleteSeededCompositions,
    async (seededComposition) => {
      const [insertedComposition] = await db
        .insert(composition)
        .values(seededComposition)
        .returning({ id: composition.id })

      return insertedComposition.id
    }
  )
}

async function seedCurrencies(): Promise<CurrencyIdsByCode> {
  return seedRecordsByCode(
    seededCurrencies,
    deleteSeededCurrencies,
    async (seededCurrency) => {
      const [insertedCurrency] = await db
        .insert(currency)
        .values(seededCurrency)
        .returning({ id: currency.id })

      return insertedCurrency.id
    }
  )
}

async function seedDistributions() {
  for (const seededDistribution of seededDistributions) {
    await db.execute(sql`
      insert into "distribution" (
        "code",
        "name",
        "created_at",
        "updated_at"
      ) values (
        ${seededDistribution.code},
        ${seededDistribution.name},
        ${sql.param(seededDistribution.createdAt, distribution.createdAt)},
        ${sql.param(seededDistribution.updatedAt, distribution.updatedAt)}
      )
      on conflict ((lower("code"))) do update
      set
        "name" = excluded."name",
        "updated_at" = excluded."updated_at"
    `)
  }

  const insertedDistributions = await db
    .select({
      id: distribution.id,
      code: distribution.code,
    })
    .from(distribution)
    .where(
      inArray(
        distribution.code,
        seededDistributions.map(({ code }) => code)
      )
    )

  return new Map(
    insertedDistributions.map((insertedDistribution) => [
      insertedDistribution.code,
      insertedDistribution.id,
    ])
  ) satisfies DistributionIdsByCode
}

async function seedEdges(): Promise<EdgeIdsByCode> {
  return seedRecordsByCode(
    seededEdges,
    deleteSeededEdges,
    async (seededEdge) => {
      const [insertedEdge] = await db
        .insert(edge)
        .values(seededEdge)
        .returning({ id: edge.id })

      return insertedEdge.id
    }
  )
}

async function seedEngravers(): Promise<EngraverIdsByCode> {
  return seedRecordsByCode(
    seededEngravers,
    deleteSeededEngravers,
    async (seededEngraver) => {
      const [insertedEngraver] = await db
        .insert(engraver)
        .values(seededEngraver)
        .returning({ id: engraver.id })

      return insertedEngraver.id
    }
  )
}

function getIssuersReadyToInsert(
  remainingIssuers: typeof seededIssuers,
  issuerIdsByCode: IssuerIdsByCode
) {
  return remainingIssuers.filter(
    ({ parentCode }) =>
      parentCode === undefined || issuerIdsByCode.has(parentCode)
  )
}

async function insertSeededIssuer(
  issuerIdsByCode: IssuerIdsByCode,
  seededIssuer: (typeof seededIssuers)[number]
) {
  const parentIssuerId = seededIssuer.parentCode
    ? getRequiredSeededId(issuerIdsByCode, seededIssuer.parentCode, "issuer")
    : undefined

  const [insertedIssuer] = await db
    .insert(issuer)
    .values({
      name: seededIssuer.name,
      code: seededIssuer.code,
      isoCode: seededIssuer.isoCode,
      parentIssuerId,
      createdAt: seededIssuer.createdAt,
      updatedAt: seededIssuer.updatedAt,
    })
    .returning({ id: issuer.id })

  issuerIdsByCode.set(seededIssuer.code, insertedIssuer.id)
}

function removeSeededIssuer(
  remainingIssuers: typeof seededIssuers,
  seededIssuerCode: string
) {
  const seededIssuerIndex = remainingIssuers.findIndex(
    ({ code }) => code === seededIssuerCode
  )

  if (seededIssuerIndex < 0) {
    throw new Error(`Missing seeded issuer ${seededIssuerCode}`)
  }

  remainingIssuers.splice(seededIssuerIndex, 1)
}

async function seedIssuers() {
  const issuerIdsByCode: IssuerIdsByCode = new Map()
  const remainingIssuers = [...seededIssuers]

  await deleteSeededIssuers()

  while (remainingIssuers.length > 0) {
    const issuersReadyToInsert = getIssuersReadyToInsert(
      remainingIssuers,
      issuerIdsByCode
    )

    if (issuersReadyToInsert.length === 0) {
      throw new Error("Unable to resolve seeded issuer parents")
    }

    for (const seededIssuer of issuersReadyToInsert) {
      await insertSeededIssuer(issuerIdsByCode, seededIssuer)
      removeSeededIssuer(remainingIssuers, seededIssuer.code)
    }
  }

  return issuerIdsByCode
}

async function seedMints(): Promise<MintIdsByCode> {
  return seedRecordsByCode(
    seededMints,
    deleteSeededMints,
    async (seededMint) => {
      const [insertedMint] = await db
        .insert(mint)
        .values(seededMint)
        .returning({ id: mint.id })

      return insertedMint.id
    }
  )
}

async function seedOrientations(): Promise<OrientationIdsByCode> {
  return seedRecordsByCode(
    seededOrientations,
    deleteSeededOrientations,
    async (seededOrientation) => {
      const [insertedOrientation] = await db
        .insert(orientation)
        .values(seededOrientation)
        .returning({ id: orientation.id })

      return insertedOrientation.id
    }
  )
}

async function seedRims(): Promise<RimIdsByCode> {
  return seedRecordsByCode(seededRims, deleteSeededRims, async (seededRim) => {
    const [insertedRim] = await db
      .insert(rim)
      .values(seededRim)
      .returning({ id: rim.id })

    return insertedRim.id
  })
}

async function seedThemes(): Promise<ThemeIdsByCode> {
  return seedRecordsByCode(
    seededThemes,
    deleteSeededThemes,
    async (seededTheme) => {
      const [insertedTheme] = await db
        .insert(theme)
        .values(seededTheme)
        .returning({ id: theme.id })

      return insertedTheme.id
    }
  )
}

async function seedTechniques(): Promise<TechniqueIdsByCode> {
  return seedRecordsByCode(
    seededTechniques,
    deleteSeededTechniques,
    async (seededTechnique) => {
      const [insertedTechnique] = await db
        .insert(technique)
        .values(seededTechnique)
        .returning({ id: technique.id })

      return insertedTechnique.id
    }
  )
}

async function seedShapes(): Promise<ShapeIdsByCode> {
  return seedRecordsByCode(
    seededShapes,
    deleteSeededShapes,
    async (seededShape) => {
      const [insertedShape] = await db
        .insert(shape)
        .values(seededShape)
        .returning({ id: shape.id })

      return insertedShape.id
    }
  )
}

async function seedCoins(
  compositionIdsByCode: CompositionIdsByCode,
  currencyIdsByCode: CurrencyIdsByCode,
  distributionIdsByCode: DistributionIdsByCode,
  edgeIdsByCode: EdgeIdsByCode,
  issuerIdsByCode: IssuerIdsByCode,
  orientationIdsByCode: OrientationIdsByCode,
  shapeIdsByCode: ShapeIdsByCode,
  rimIdsByCode: RimIdsByCode,
  techniqueIdsByCode: TechniqueIdsByCode
) {
  await db.delete(coin).where(
    inArray(
      coin.title,
      seededCoins.map(({ title }) => title)
    )
  )

  const insertedCoins = await db
    .insert(coin)
    .values(
      seededCoins.map((seededCoin) =>
        mapSeededCoinToInsertValues(
          seededCoin,
          compositionIdsByCode,
          currencyIdsByCode,
          distributionIdsByCode,
          edgeIdsByCode,
          issuerIdsByCode,
          orientationIdsByCode,
          shapeIdsByCode,
          rimIdsByCode,
          techniqueIdsByCode
        )
      )
    )
    .returning({ id: coin.id, title: coin.title })
  const coinIdsByTitle: CoinIdsByTitle = new Map(
    insertedCoins.map((insertedCoin) => [insertedCoin.title, insertedCoin.id])
  )

  return coinIdsByTitle
}

async function seedCoinFaces(coinIdsByTitle: CoinIdsByTitle) {
  if (seededCoinFaces.length === 0) {
    const coinFaceIdsByKey: CoinFaceIdsByKey = new Map()

    return coinFaceIdsByKey
  }

  const insertedCoinFaces = await db
    .insert(coinFace)
    .values(
      seededCoinFaces.map((seededCoinFace) => ({
        coinId: getRequiredSeededId(
          coinIdsByTitle,
          seededCoinFace.coinTitle,
          "coin"
        ),
        side: seededCoinFace.side,
        description: seededCoinFace.description,
        lettering: seededCoinFace.lettering,
      }))
    )
    .returning({
      id: coinFace.id,
      coinId: coinFace.coinId,
      side: coinFace.side,
    })

  const coinTitlesById = new Map(
    [...coinIdsByTitle.entries()].map(([title, id]) => [id, title])
  )

  const coinFaceIdsByKey: CoinFaceIdsByKey = new Map(
    insertedCoinFaces.map((insertedCoinFace) => {
      const coinTitle = coinTitlesById.get(insertedCoinFace.coinId)

      if (!coinTitle) {
        throw new Error(
          `Missing seeded coin title for face ${insertedCoinFace.id}`
        )
      }

      return [
        getCoinFaceSeedKey(coinTitle, insertedCoinFace.side),
        insertedCoinFace.id,
      ]
    })
  )

  return coinFaceIdsByKey
}

async function seedCoinFaceEngravers(
  coinFaceIdsByKey: CoinFaceIdsByKey,
  engraverIdsByCode: EngraverIdsByCode
) {
  if (seededCoinFaceEngravers.length === 0) {
    return
  }

  await db.insert(coinFaceEngraver).values(
    seededCoinFaceEngravers.map((seededCoinFaceEngraver) => ({
      coinFaceId: getRequiredSeededId(
        coinFaceIdsByKey,
        getCoinFaceSeedKey(
          seededCoinFaceEngraver.coinTitle,
          seededCoinFaceEngraver.side
        ),
        "coin face"
      ),
      engraverId: getRequiredSeededId(
        engraverIdsByCode,
        seededCoinFaceEngraver.engraverCode,
        "engraver"
      ),
    }))
  )
}

function mapSeededCoinToInsertValues(
  seededCoin: (typeof seededCoins)[number],
  compositionIdsByCode: CompositionIdsByCode,
  currencyIdsByCode: CurrencyIdsByCode,
  edgeIdsByCode: EdgeIdsByCode,
  issuerIdsByCode: IssuerIdsByCode,
  orientationIdsByCode: OrientationIdsByCode,
  shapeIdsByCode: ShapeIdsByCode,
  rimIdsByCode: RimIdsByCode,
  techniqueIdsByCode: TechniqueIdsByCode,
  distributionIdsByCode: DistributionIdsByCode
) {
  const {
    issuerCode,
    distributionCode,
    compositionCode,
    currencyCode,
    edgeCode,
    edgeDescription,
    edgeLettering,
    orientationCode,
    shapeCode,
    rimCode,
    techniqueCode,
    ...coinValues
  } = seededCoin

  return {
    ...coinValues,
    comments: normalizeCoinComments(coinValues.comments),
    compositionId: getRequiredSeededId(
      compositionIdsByCode,
      compositionCode,
      "composition"
    ),
    currencyId: getRequiredSeededId(
      currencyIdsByCode,
      currencyCode,
      "currency"
    ),
    distributionId: getRequiredSeededId(
      distributionIdsByCode,
      distributionCode,
      "distribution"
    ),
    edgeDescription,
    edgeLettering,
    edgeId: edgeCode
      ? getRequiredSeededId(edgeIdsByCode, edgeCode, "edge")
      : undefined,
    issuerId: getRequiredSeededId(issuerIdsByCode, issuerCode, "issuer"),
    orientationId: orientationCode
      ? getRequiredSeededId(
          orientationIdsByCode,
          orientationCode,
          "orientation"
        )
      : undefined,
    shapeId: shapeCode
      ? getRequiredSeededId(shapeIdsByCode, shapeCode, "shape")
      : undefined,
    rimId: rimCode
      ? getRequiredSeededId(rimIdsByCode, rimCode, "rim")
      : undefined,
    techniqueId: techniqueCode
      ? getRequiredSeededId(techniqueIdsByCode, techniqueCode, "technique")
      : undefined,
  }
}

async function seedCoinRulers(
  coinIdsByTitle: CoinIdsByTitle,
  rulerIdsByCode: RulerIdsByCode
) {
  await db.insert(coinRuler).values(
    seededCoinRulers.map((seededCoinRuler) => ({
      coinId: getRequiredSeededId(
        coinIdsByTitle,
        seededCoinRuler.coinTitle,
        "coin"
      ),
      rulerId: getRequiredSeededId(
        rulerIdsByCode,
        seededCoinRuler.rulerCode,
        "ruler"
      ),
      rulerOrder: seededCoinRuler.rulerOrder,
    }))
  )
}

async function seedCoinReferences(
  coinIdsByTitle: CoinIdsByTitle,
  catalogueIdsByCode: CatalogueIdsByCode
) {
  await db.insert(coinReference).values(
    seededCoinReferences.map((seededCoinReference) => ({
      coinId: getRequiredSeededId(
        coinIdsByTitle,
        seededCoinReference.coinTitle,
        "coin"
      ),
      catalogueId: getRequiredSeededId(
        catalogueIdsByCode,
        seededCoinReference.catalogueCode,
        "catalogue"
      ),
      number: seededCoinReference.number,
      createdAt: seededCoinReference.createdAt,
      updatedAt: seededCoinReference.updatedAt,
    }))
  )
}

async function seedCoinMints(
  coinIdsByTitle: CoinIdsByTitle,
  mintIdsByCode: MintIdsByCode
) {
  await db.insert(coinMint).values(
    seededCoinMints.map((seededCoinMint) => ({
      coinId: getRequiredSeededId(
        coinIdsByTitle,
        seededCoinMint.coinTitle,
        "coin"
      ),
      mintId: getRequiredSeededId(
        mintIdsByCode,
        seededCoinMint.mintCode,
        "mint"
      ),
    }))
  )
}

async function seedCoinThemes(
  coinIdsByTitle: CoinIdsByTitle,
  themeIdsByCode: ThemeIdsByCode
) {
  await db.insert(coinTheme).values(
    seededCoinThemes.map((seededCoinTheme) => ({
      coinId: getRequiredSeededId(
        coinIdsByTitle,
        seededCoinTheme.coinTitle,
        "coin"
      ),
      themeId: getRequiredSeededId(
        themeIdsByCode,
        seededCoinTheme.themeCode,
        "theme"
      ),
    }))
  )
}

export async function seedDatabase() {
  await deleteSeededCoins()

  const catalogueIdsByCode = await seedCatalogues()
  const compositionIdsByCode = await seedCompositions()
  const currencyIdsByCode = await seedCurrencies()
  const distributionIdsByCode = await seedDistributions()
  const edgeIdsByCode = await seedEdges()
  const issuerIdsByCode = await seedIssuers()
  const mintIdsByCode = await seedMints()
  const engraverIdsByCode = await seedEngravers()
  const orientationIdsByCode = await seedOrientations()
  const shapeIdsByCode = await seedShapes()
  const rimIdsByCode = await seedRims()
  const techniqueIdsByCode = await seedTechniques()
  const themeIdsByCode = await seedThemes()
  const coinIdsByTitle = await seedCoins(
    compositionIdsByCode,
    currencyIdsByCode,
    edgeIdsByCode,
    issuerIdsByCode,
    orientationIdsByCode,
    shapeIdsByCode,
    rimIdsByCode,
    techniqueIdsByCode,
    distributionIdsByCode
  )
  const rulerIdsByCode = await seedRulers()

  const coinFaceIdsByKey = await seedCoinFaces(coinIdsByTitle)
  await seedCoinFaceEngravers(coinFaceIdsByKey, engraverIdsByCode)
  await seedCoinRulers(coinIdsByTitle, rulerIdsByCode)
  await seedCoinMints(coinIdsByTitle, mintIdsByCode)
  await seedCoinThemes(coinIdsByTitle, themeIdsByCode)
  await seedCoinReferences(coinIdsByTitle, catalogueIdsByCode)
}

function isExecutedDirectly() {
  const entrypointPath = process.argv.at(1)

  return (
    entrypointPath !== undefined &&
    import.meta.url === pathToFileURL(entrypointPath).href
  )
}

if (isExecutedDirectly()) {
  try {
    await seedDatabase()
  } finally {
    await closeDb()
  }
}
