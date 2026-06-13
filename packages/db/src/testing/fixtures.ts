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
import { db } from "../index"
import { normalizeCoinComments } from "../normalize-coin-comments"
import { getOrCreateDefaultComposition as getDefaultComposition } from "./default-composition"
import { getOrCreateDefaultCurrency as getDefaultCurrency } from "./default-currency"
import { getOrCreateDefaultDistribution as getDefaultDistribution } from "./default-distribution"

type CreateIssuerInput = {
  code: string
  isoCode?: string
  name: string
  parentIssuerId?: string
}

type CreateCoinInput = {
  comments?: string | null
  createdAt: Date
  diameter?: number
  compositionId?: string
  currencyId?: string
  distributionId?: string
  faceValueNumericValue?: number
  faceValueText?: string
  edgeDescription?: string | null
  edgeId?: string
  edgeLettering?: string | null
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
  updatedAt?: Date
  weight?: number
}

type CreateMintInput = {
  code: string
  name: string
}

type CreateOrientationInput = {
  code: string
  name: string
}

type CreateThemeInput = {
  code: string
  name: string
}

type CreateTechniqueInput = {
  code: string
  name: string
}

type CreateShapeInput = {
  code: string
  name: string
}

type CreateRimInput = {
  code: string
  name: string
}

type CreateRulerGroupInput = {
  code: string
  name: string
}

type CreateRulerInput = {
  code: string
  name: string
  rulerGroupId?: string
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

type CreateCoinFaceInput = {
  coinId: string
  side: CoinFaceSide
  description?: string | null
  lettering?: string | null
}

type CreateCoinThemeInput = {
  coinId: string
  themeId: string
}

type CreateCoinFaceEngraverInput = {
  coinFaceId: string
  engraverId: string
}

type CreateCatalogueInput = {
  code: string
  title: string
}

export async function createCatalogue({ code, title }: CreateCatalogueInput) {
  const [createdCatalogue] = await db
    .insert(catalogue)
    .values({
      code,
      title,
    })
    .returning()

  return createdCatalogue
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

export async function createIssuer({
  code,
  isoCode = "ZZ",
  name,
  parentIssuerId,
}: CreateIssuerInput) {
  const [createdIssuer] = await db
    .insert(issuer)
    .values({
      code,
      isoCode,
      name,
      parentIssuerId,
    })
    .returning()

  return createdIssuer
}

export async function createCoin({
  comments,
  createdAt,
  diameter,
  compositionId,
  currencyId,
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
  updatedAt = createdAt,
  weight,
}: CreateCoinInput) {
  const resolvedDistributionId =
    distributionId ?? (await getOrCreateDefaultDistribution()).id
  const resolvedCompositionId =
    compositionId ?? (await getOrCreateDefaultComposition()).id
  const resolvedCurrencyId =
    currencyId ?? (await getOrCreateDefaultCurrency()).id

  const [createdCoin] = await db
    .insert(coin)
    .values({
      comments: normalizeCoinComments(comments),
      createdAt,
      compositionId: resolvedCompositionId,
      currencyId: resolvedCurrencyId,
      distributionId: resolvedDistributionId,
      edgeDescription,
      edgeId,
      edgeLettering,
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

  return createdCoin
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

export async function createCoinFace({
  coinId,
  side,
  description,
  lettering,
}: CreateCoinFaceInput) {
  const [createdCoinFace] = await db
    .insert(coinFace)
    .values({
      coinId,
      side,
      description,
      lettering,
    })
    .returning()

  return createdCoinFace
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

export async function createCoinFaceEngraver({
  coinFaceId,
  engraverId,
}: CreateCoinFaceEngraverInput) {
  const [createdCoinFaceEngraver] = await db
    .insert(coinFaceEngraver)
    .values({
      coinFaceId,
      engraverId,
    })
    .returning()

  return createdCoinFaceEngraver
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
