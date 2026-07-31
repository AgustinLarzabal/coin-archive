import { eq } from "drizzle-orm"
import { catalogue } from "../schema/catalogue"
import { coin } from "../schema/coin"
import { coinSurface, coinSurfaceKinds } from "../schema/coin-surface"
import { coinSurfaceEngraver } from "../schema/coin-surface-engraver"
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
import { db } from "../index"
import { createCatalogue as createCatalogueRecord } from "../mutations/create-catalogue"
import { normalizeCoinSurfaceUrls } from "../normalize-coin-surface-urls"
import { normalizeCoinComments } from "../normalize-coin-comments"
import { getOrCreateDefaultComposition as getDefaultComposition } from "./default-composition"
import { getOrCreateDefaultCurrency as getDefaultCurrency } from "./default-currency"
import { getOrCreateDefaultDistribution as getDefaultDistribution } from "./default-distribution"

const [, , edgeSurfaceKind] = coinSurfaceKinds
type CoinSurfaceKind = (typeof coinSurfaceKinds)[number]
type EngravableCoinSurfaceKind = Exclude<
  CoinSurfaceKind,
  typeof edgeSurfaceKind
>

type CreateCoinSurfaceDetailsInput = Omit<CreateCoinSurfaceInput, "coinId">

type CreateCoinInput = {
  comments?: string | null
  compositionDescription?: string | null
  compositionId?: string
  surfaces?: CreateCoinSurfaceDetailsInput[]
  currencyId?: string
  diameter?: number
  distributionId?: string
  edgeDescription?: string | null
  edgeId?: string
  edgeLettering?: string | null
  faceValueNumericValue?: number
  faceValueText?: string
  isDemonetized?: boolean | null
  issuerId: string
  maxYear?: number
  mintage?: number | null
  minYear?: number
  orientationId?: string
  rimId?: string
  shapeId?: string
  techniqueId?: string
  thickness?: number
  title: string
  weight?: number
  createdAt: Date
  updatedAt?: Date
}

export async function createCoin({
  comments,
  compositionDescription,
  compositionId,
  surfaces,
  currencyId,
  diameter,
  distributionId,
  edgeDescription,
  edgeId,
  edgeLettering,
  faceValueNumericValue = 1,
  faceValueText = "1 Test Unit",
  isDemonetized,
  issuerId,
  maxYear,
  mintage,
  minYear,
  orientationId,
  rimId,
  shapeId,
  techniqueId,
  thickness,
  title,
  weight,
  createdAt,
  updatedAt = createdAt,
}: CreateCoinInput) {
  const resolvedDistributionId =
    distributionId ?? (await getDefaultDistribution(db)).id
  const resolvedCompositionId =
    compositionId ?? (await getDefaultComposition(db)).id
  const resolvedCurrencyId = currencyId ?? (await getDefaultCurrency(db)).id
  const resolvedSurfaces = [...(surfaces ?? [])]

  if (edgeDescription !== undefined || edgeLettering !== undefined) {
    resolvedSurfaces.push({
      kind: edgeSurfaceKind,
      description: edgeDescription,
      lettering: edgeLettering,
    })
  }

  const [createdCoin] = await db
    .insert(coin)
    .values({
      comments: normalizeCoinComments(comments),
      compositionDescription,
      createdAt,
      compositionId: resolvedCompositionId,
      currencyId: resolvedCurrencyId,
      distributionId: resolvedDistributionId,
      edgeId,
      faceValueNumericValue,
      faceValueText,
      isDemonetized,
      issuerId,
      maxYear,
      mintage,
      minYear,
      orientationId,
      rimId,
      shapeId,
      techniqueId,
      diameter,
      thickness,
      title,
      updatedAt,
      weight,
    })
    .returning()

  for (const surface of resolvedSurfaces) {
    await createCoinSurface({
      coinId: createdCoin.id,
      kind: surface.kind,
      description: surface.description,
      lettering: surface.lettering,
      imageUrl: surface.imageUrl,
    })
  }

  return createdCoin
}

type CreateCoinRulerInput = {
  coinId: string
  rulerId: string
  rulerOrder: number
}

type CreateCoinReferenceInput = {
  catalogueId: string
  coinId: string
  number: string
}

type CreateCoinMintInput = {
  coinId: string
  mintId: string
}

type CreateCoinSurfaceInput = {
  coinId: string
  kind: CoinSurfaceKind
  description?: string | null
  lettering?: string | null
  imageUrl?: string | null
}

type CreateCoinThemeInput = {
  coinId: string
  themeId: string
}

type CreateCoinSurfaceEngraverInput = {
  coinSurfaceId: string
  coinSurfaceKind?: EngravableCoinSurfaceKind
  engraverId: string
}

type CreateCatalogueInput = {
  code: string
  title: string
}

export async function createCatalogue({ code, title }: CreateCatalogueInput) {
  return createCatalogueRecord({ code, title })
}

type CreateCompositionInput = {
  code: string
  name: string
  description?: string | null
}

export async function createComposition({
  code,
  name,
  description,
}: CreateCompositionInput) {
  const [createdComposition] = await db
    .insert(composition)
    .values({
      code,
      name,
      description,
    })
    .returning()

  return createdComposition
}

type CreateCurrencyInput = {
  code: string
  name: string
  fullName: string
}

export async function createCurrency({
  code,
  name,
  fullName,
}: CreateCurrencyInput) {
  const [createdCurrency] = await db
    .insert(currency)
    .values({
      code,
      name,
      fullName,
    })
    .returning()

  return createdCurrency
}

type CreateDistributionInput = {
  code: string
  name: string
}

export async function createDistribution({
  code,
  name,
}: CreateDistributionInput) {
  const [createdDistribution] = await db
    .insert(distribution)
    .values({
      code,
      name,
    })
    .returning()

  return createdDistribution
}

type CreateEdgeInput = {
  code: string
  name: string
}

export async function createEdge({ code, name }: CreateEdgeInput) {
  const [createdEdge] = await db
    .insert(edge)
    .values({
      code,
      name,
    })
    .returning()

  return createdEdge
}

type CreateEngraverInput = {
  code: string
  name: string
}

export async function createEngraver({ code, name }: CreateEngraverInput) {
  const [createdEngraver] = await db
    .insert(engraver)
    .values({
      code,
      name,
    })
    .returning()

  return createdEngraver
}

type CreateIssuerInput = {
  code: string
  name: string
  isoCode?: string
  parentIssuerId?: string
}

export async function createIssuer({
  code,
  name,
  isoCode = "ZZ",
  parentIssuerId,
}: CreateIssuerInput) {
  const [createdIssuer] = await db
    .insert(issuer)
    .values({
      code,
      name,
      isoCode,
      parentIssuerId,
    })
    .returning()

  return createdIssuer
}

type CreateMintInput = {
  code: string
  name: string
}

export async function createMint({ code, name }: CreateMintInput) {
  const [createdMint] = await db
    .insert(mint)
    .values({
      code,
      name,
    })
    .returning()

  return createdMint
}

type CreateOrientationInput = {
  code: string
  name: string
}

export async function createOrientation({
  code,
  name,
}: CreateOrientationInput) {
  const [createdOrientation] = await db
    .insert(orientation)
    .values({
      code,
      name,
    })
    .returning()

  return createdOrientation
}

type CreateRimInput = {
  code: string
  name: string
}

export async function createRim({ code, name }: CreateRimInput) {
  const [createdRim] = await db
    .insert(rim)
    .values({
      code,
      name,
    })
    .returning()

  return createdRim
}

type CreateRulerGroupInput = {
  code: string
  name: string
}

export async function createRulerGroup({ code, name }: CreateRulerGroupInput) {
  const [createdRulerGroup] = await db
    .insert(rulerGroup)
    .values({
      code,
      name,
    })
    .returning()

  return createdRulerGroup
}

type CreateRulerInput = {
  code: string
  name: string
  rulerGroupId?: string
}

export async function createRuler({
  code,
  name,
  rulerGroupId,
}: CreateRulerInput) {
  const [createdRuler] = await db
    .insert(ruler)
    .values({
      code,
      name,
      rulerGroupId,
    })
    .returning()

  return createdRuler
}

type CreateShapeInput = {
  code: string
  name: string
}

export async function createShape({ code, name }: CreateShapeInput) {
  const [createdShape] = await db
    .insert(shape)
    .values({
      code,
      name,
    })
    .returning()

  return createdShape
}

type CreateTechniqueInput = {
  code: string
  name: string
}

export async function createTechnique({ code, name }: CreateTechniqueInput) {
  const [createdTechnique] = await db
    .insert(technique)
    .values({
      code,
      name,
    })
    .returning()

  return createdTechnique
}

type CreateThemeInput = {
  code: string
  name: string
}

export async function createTheme({ code, name }: CreateThemeInput) {
  const [createdTheme] = await db
    .insert(theme)
    .values({
      code,
      name,
    })
    .returning()

  return createdTheme
}

export async function createCoinRuler({
  coinId,
  rulerId,
  rulerOrder,
}: CreateCoinRulerInput) {
  const [createdCoinRuler] = await db
    .insert(coinRuler)
    .values({
      coinId,
      rulerId,
      rulerOrder,
    })
    .returning()

  return createdCoinRuler
}

export async function createCoinReference({
  catalogueId,
  coinId,
  number,
}: CreateCoinReferenceInput) {
  const [createdCoinReference] = await db
    .insert(coinReference)
    .values({
      catalogueId,
      coinId,
      number,
    })
    .returning()

  return createdCoinReference
}

export async function createCoinMint({ coinId, mintId }: CreateCoinMintInput) {
  const [createdCoinMint] = await db
    .insert(coinMint)
    .values({
      coinId,
      mintId,
    })
    .returning()

  return createdCoinMint
}

export async function createCoinSurface({
  coinId,
  kind,
  description,
  lettering,
  imageUrl,
}: CreateCoinSurfaceInput) {
  const [createdCoinSurface] = await db
    .insert(coinSurface)
    .values({
      coinId,
      kind,
      description,
      lettering,
      ...normalizeCoinSurfaceUrls({ imageUrl }),
    })
    .returning()

  return createdCoinSurface
}

export async function createCoinTheme({
  coinId,
  themeId,
}: CreateCoinThemeInput) {
  const [createdCoinTheme] = await db
    .insert(coinTheme)
    .values({
      coinId,
      themeId,
    })
    .returning()

  return createdCoinTheme
}

export async function createCoinSurfaceEngraver({
  coinSurfaceId,
  coinSurfaceKind,
  engraverId,
}: CreateCoinSurfaceEngraverInput) {
  const resolvedCoinSurfaceKind =
    coinSurfaceKind ?? (await getEngravableCoinSurfaceKind(coinSurfaceId))

  const [createdCoinSurfaceEngraver] = await db
    .insert(coinSurfaceEngraver)
    .values({
      coinSurfaceId,
      coinSurfaceKind: resolvedCoinSurfaceKind,
      engraverId,
    })
    .returning()

  return createdCoinSurfaceEngraver
}

async function getEngravableCoinSurfaceKind(
  coinSurfaceId: string
): Promise<EngravableCoinSurfaceKind> {
  const [matchedSurface] = await db
    .select({
      kind: coinSurface.kind,
    })
    .from(coinSurface)
    .where(eq(coinSurface.id, coinSurfaceId))
    .limit(1)

  if (matchedSurface.kind === "edge-surface") {
    throw new Error("Coin surface engravers can only target obverse or reverse")
  }

  return matchedSurface.kind
}

async function getOrCreateDefaultDistribution() {
  return getDefaultDistribution(db)
}

async function getOrCreateDefaultComposition() {
  return getDefaultComposition(db)
}

async function getOrCreateDefaultCurrency() {
  return getDefaultCurrency(db)
}
