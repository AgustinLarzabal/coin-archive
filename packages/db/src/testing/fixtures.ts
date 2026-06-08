import { catalogue } from "../schema/catalogue"
import { coin } from "../schema/coin"
import { coinReference } from "../schema/coin-reference"
import { coinRuler } from "../schema/coin-ruler"
import { composition } from "../schema/composition"
import { distribution } from "../schema/distribution"
import { issuer } from "../schema/issuer"
import { ruler } from "../schema/ruler"
import { rulerGroup } from "../schema/ruler-group"
import { db } from "../index"
import { getOrCreateDefaultComposition as getDefaultComposition } from "./default-composition"
import { getOrCreateDefaultDistribution as getDefaultDistribution } from "./default-distribution"

type CreateIssuerInput = {
  code: string
  name: string
  parentIssuerId?: string
}

type CreateCoinInput = {
  createdAt: Date
  diameter?: number
  compositionId?: string
  distributionId?: string
  issuerId: string
  maxYear?: number
  minYear?: number
  thickness?: number
  title: string
  updatedAt?: Date
  weight?: number
}

type CreateDistributionInput = {
  code: string
  name: string
}

type CreateCompositionInput = {
  code: string
  description?: string | null
  name: string
}

type CreateRulerGroupInput = {
  code: string
  name: string
}

type CreateCatalogueInput = {
  code: string
  title: string
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

export async function createIssuer({
  code,
  name,
  parentIssuerId,
}: CreateIssuerInput) {
  const [createdIssuer] = await db
    .insert(issuer)
    .values({
      code,
      name,
      parentIssuerId,
    })
    .returning()

  return createdIssuer
}

export async function createCoin({
  createdAt,
  diameter,
  compositionId,
  distributionId,
  issuerId,
  maxYear,
  minYear,
  thickness,
  title,
  updatedAt = createdAt,
  weight,
}: CreateCoinInput) {
  const resolvedDistributionId =
    distributionId ?? (await getOrCreateDefaultDistribution()).id
  const resolvedCompositionId =
    compositionId ?? (await getOrCreateDefaultComposition()).id

  const [createdCoin] = await db
    .insert(coin)
    .values({
      createdAt,
      compositionId: resolvedCompositionId,
      distributionId: resolvedDistributionId,
      issuerId,
      maxYear,
      minYear,
      diameter,
      thickness,
      title,
      updatedAt,
      weight,
    })
    .returning()

  return createdCoin
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

export async function createComposition({
  code,
  description,
  name,
}: CreateCompositionInput) {
  const [createdComposition] = await db
    .insert(composition)
    .values({
      code,
      description,
      name,
    })
    .returning()

  return createdComposition
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

async function getOrCreateDefaultDistribution() {
  return getDefaultDistribution(db)
}

async function getOrCreateDefaultComposition() {
  return getDefaultComposition(db)
}
