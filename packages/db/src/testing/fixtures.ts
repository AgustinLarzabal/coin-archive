import { catalogue } from "../schema/catalogue"
import { coin } from "../schema/coin"
import { coinReference } from "../schema/coin-reference"
import { coinRuler } from "../schema/coin-ruler"
import { issuer } from "../schema/issuer"
import { ruler } from "../schema/ruler"
import { rulerGroup } from "../schema/ruler-group"
import { db } from "../index"

type CreateIssuerInput = {
  code: string
  name: string
  parentIssuerId?: string
}

type CreateCoinInput = {
  createdAt: Date
  issuerId: string
  title: string
  updatedAt?: Date
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
  issuerId,
  title,
  updatedAt = createdAt,
}: CreateCoinInput) {
  const [createdCoin] = await db
    .insert(coin)
    .values({
      createdAt,
      issuerId,
      title,
      updatedAt,
    })
    .returning()

  return createdCoin
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
