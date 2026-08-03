import { and, eq, lte, sql } from "drizzle-orm"

import { db } from "../client"
import type { db as databaseClient } from "../client"
import type {
  CoinMaintenanceFaceSurface,
  CoinMaintenanceReference,
  CoinMaintenanceSurface,
  CoinMaintenanceSurfaceSet,
} from "../coin-maintenance-record"
import { normalizeCoinComments } from "../normalize-coin-comments"
import { normalizeCoinSurfaceUrls } from "../normalize-coin-surface-urls"
import { coin } from "../schema/coin"
import { coinMint } from "../schema/coin-mint"
import { coinReference } from "../schema/coin-reference"
import { coinRuler } from "../schema/coin-ruler"
import { coinSurface } from "../schema/coin-surface"
import { coinSurfaceEngraver } from "../schema/coin-surface-engraver"
import { coinTheme } from "../schema/coin-theme"
import { maintenanceIdempotency } from "../schema/maintenance-idempotency"
import type { Coin } from "../schema/coin"

export type CoinMaintenanceFields = {
  comments: string | null
  compositionDescription: string | null
  compositionId: string
  currencyId: string
  diameter: number | null
  distributionId: string
  edgeId: string | null
  faceValueNumericValue: number
  faceValueText: string
  isDemonetized: boolean | null
  issuerId: string
  maxYear: number | null
  mintIds: string[]
  minYear: number | null
  mintage: number | null
  orientationId: string | null
  references?: CoinMaintenanceReference[]
  rimId: string | null
  rulerIds: string[]
  shapeId: string | null
  surfaces?: CoinMaintenanceSurfaceSet
  techniqueId: string | null
  themeIds: string[]
  thickness: number | null
  title: string
  weight: number | null
}

type CreateCoinMaintenanceInput = CoinMaintenanceFields

export type CreateCoinMaintenanceIdempotentlyResult =
  | { status: "created" | "replayed"; coin: Coin }
  | { status: "mismatch" }

type UpdateCoinMaintenanceInput = CoinMaintenanceFields & {
  id: string
}

type CoinMaintenanceTransaction = Parameters<
  Parameters<typeof db.transaction>[0]
>[0]

function normalizeOptionalText(value: string | null) {
  if (value === null) {
    return null
  }

  const normalizedValue = value.trim()
  return normalizedValue === "" ? null : normalizedValue
}

function normalizeCoinReference(reference: CoinMaintenanceReference) {
  return {
    catalogueId: reference.catalogueId,
    number: reference.number.trim(),
  }
}

function normalizeCoinSurface(surface: CoinMaintenanceSurface) {
  return {
    description: normalizeOptionalText(surface.description),
    lettering: normalizeOptionalText(surface.lettering),
    ...normalizeCoinSurfaceUrls(surface),
  }
}

function normalizeCoinFaceSurface(surface: CoinMaintenanceFaceSurface) {
  return {
    ...normalizeCoinSurface(surface),
    engraverIds: surface.engraverIds,
  }
}

function hasPersistedFaceSurfaceContent(
  surface: ReturnType<typeof normalizeCoinFaceSurface>
) {
  return (
    surface.description !== null ||
    surface.lettering !== null ||
    surface.imageUrl !== null ||
    surface.engraverIds.length > 0
  )
}

function getPersistedFaceSurface(surface: CoinMaintenanceFaceSurface | null) {
  if (surface === null) {
    return null
  }

  const normalizedSurface = normalizeCoinFaceSurface(surface)

  return hasPersistedFaceSurfaceContent(normalizedSurface)
    ? normalizedSurface
    : null
}

function hasPersistedSurfaceContent(
  surface: ReturnType<typeof normalizeCoinSurface>
) {
  return (
    surface.description !== null ||
    surface.lettering !== null ||
    surface.imageUrl !== null
  )
}

function getPersistedSurface(surface: CoinMaintenanceSurface | null) {
  if (surface === null) {
    return null
  }

  const normalizedSurface = normalizeCoinSurface(surface)

  return hasPersistedSurfaceContent(normalizedSurface)
    ? normalizedSurface
    : null
}

function normalizeCoinMaintenanceFields(fields: CoinMaintenanceFields) {
  return {
    comments: normalizeCoinComments(fields.comments),
    compositionDescription: normalizeOptionalText(
      fields.compositionDescription
    ),
    compositionId: fields.compositionId,
    currencyId: fields.currencyId,
    diameter: fields.diameter,
    distributionId: fields.distributionId,
    edgeId: fields.edgeId,
    faceValueNumericValue: fields.faceValueNumericValue,
    faceValueText: fields.faceValueText.trim(),
    isDemonetized: fields.isDemonetized,
    issuerId: fields.issuerId,
    maxYear: fields.maxYear,
    minYear: fields.minYear,
    mintage: fields.mintage,
    orientationId: fields.orientationId,
    rimId: fields.rimId,
    shapeId: fields.shapeId,
    techniqueId: fields.techniqueId,
    thickness: fields.thickness,
    title: fields.title.trim(),
    weight: fields.weight,
  }
}

function getCoinReferences(fields: CoinMaintenanceFields) {
  return fields.references ?? []
}

function getCoinSurfaces(
  fields: CoinMaintenanceFields
): CoinMaintenanceSurfaceSet {
  return (
    fields.surfaces ?? {
      obverse: null,
      reverse: null,
      edge: null,
    }
  )
}

async function replaceCoinRulers(
  coinId: string,
  rulerIds: string[],
  tx: CoinMaintenanceTransaction
) {
  await tx.delete(coinRuler).where(eq(coinRuler.coinId, coinId))

  if (rulerIds.length === 0) {
    return
  }

  await tx.insert(coinRuler).values(
    rulerIds.map((rulerId, index) => ({
      coinId,
      rulerId,
      rulerOrder: index + 1,
    }))
  )
}

async function replaceCoinMints(
  coinId: string,
  mintIds: string[],
  tx: CoinMaintenanceTransaction
) {
  await tx.delete(coinMint).where(eq(coinMint.coinId, coinId))

  if (mintIds.length === 0) {
    return
  }

  await tx.insert(coinMint).values(
    mintIds.map((mintId) => ({
      coinId,
      mintId,
    }))
  )
}

async function replaceCoinThemes(
  coinId: string,
  themeIds: string[],
  tx: CoinMaintenanceTransaction
) {
  await tx.delete(coinTheme).where(eq(coinTheme.coinId, coinId))

  if (themeIds.length === 0) {
    return
  }

  await tx.insert(coinTheme).values(
    themeIds.map((themeId) => ({
      coinId,
      themeId,
    }))
  )
}

async function replaceCoinReferences(
  coinId: string,
  references: CoinMaintenanceReference[],
  tx: CoinMaintenanceTransaction
) {
  await tx.delete(coinReference).where(eq(coinReference.coinId, coinId))

  if (references.length === 0) {
    return
  }

  await tx.insert(coinReference).values(
    references.map((reference) => ({
      coinId,
      ...normalizeCoinReference(reference),
    }))
  )
}

async function replaceCoinSurfaces(
  coinId: string,
  surfaces: CoinMaintenanceSurfaceSet,
  tx: CoinMaintenanceTransaction
) {
  await tx.delete(coinSurface).where(eq(coinSurface.coinId, coinId))

  const persistedObverse = getPersistedFaceSurface(surfaces.obverse)
  const persistedReverse = getPersistedFaceSurface(surfaces.reverse)
  const persistedEdge = getPersistedSurface(surfaces.edge)

  for (const [kind, surface] of [
    ["obverse", persistedObverse],
    ["reverse", persistedReverse],
    ["edge-surface", persistedEdge],
  ] as const) {
    if (surface === null) {
      continue
    }

    const [createdSurface] = await tx
      .insert(coinSurface)
      .values({
        coinId,
        kind,
        description: surface.description,
        lettering: surface.lettering,
        imageUrl: surface.imageUrl,
      })
      .returning({
        id: coinSurface.id,
      })

    if (kind !== "edge-surface" && surface.engraverIds.length > 0) {
      await tx.insert(coinSurfaceEngraver).values(
        surface.engraverIds.map((engraverId) => ({
          coinSurfaceId: createdSurface.id,
          coinSurfaceKind: kind,
          engraverId,
        }))
      )
    }
  }
}

export async function createCoinMaintenance(
  fields: CreateCoinMaintenanceInput
) {
  return db.transaction(async (tx) => {
    return createCoinAggregate(fields, tx)
  })
}

async function createCoinAggregate(
  fields: CreateCoinMaintenanceInput,
  transaction: CoinMaintenanceTransaction
) {
  const [createdCoin] = await transaction
    .insert(coin)
    .values(normalizeCoinMaintenanceFields(fields))
    .returning()

  await replaceCoinRulers(createdCoin.id, fields.rulerIds, transaction)
  await replaceCoinMints(createdCoin.id, fields.mintIds, transaction)
  await replaceCoinThemes(createdCoin.id, fields.themeIds, transaction)
  await replaceCoinReferences(
    createdCoin.id,
    getCoinReferences(fields),
    transaction
  )
  await replaceCoinSurfaces(
    createdCoin.id,
    getCoinSurfaces(fields),
    transaction
  )

  return createdCoin
}

export function createCoinMaintenanceIdempotently(
  input: Parameters<typeof createCoinMaintenanceIdempotentlyWithDatabase>[1]
) {
  return createCoinMaintenanceIdempotentlyWithDatabase(db, input)
}

export async function createCoinMaintenanceIdempotentlyWithDatabase(
  database: typeof databaseClient,
  {
    collectorId,
    idempotencyKey,
    requestHash,
    expiresAt,
    fields,
  }: {
    collectorId: string
    idempotencyKey: string
    requestHash: string
    expiresAt: Date
    fields?: CreateCoinMaintenanceInput
  },
  prepareFields?: () => Promise<CreateCoinMaintenanceInput>
): Promise<CreateCoinMaintenanceIdempotentlyResult> {
  return database.transaction(async (transaction) => {
    await transaction
      .delete(maintenanceIdempotency)
      .where(lte(maintenanceIdempotency.expiresAt, new Date()))
    const inserted = (
      await transaction
        .insert(maintenanceIdempotency)
        .values({
          collectorId,
          operation: "coin.create",
          key: idempotencyKey,
          requestHash,
          expiresAt,
        })
        .onConflictDoNothing()
        .returning()
    ).at(0)
    const record =
      inserted ??
      (await transaction.query.maintenanceIdempotency.findFirst({
        where: (entry, { and: all, eq: equal }) =>
          all(
            equal(entry.collectorId, collectorId),
            equal(entry.operation, "coin.create"),
            equal(entry.key, idempotencyKey)
          ),
      }))
    if (record === undefined || record.requestHash !== requestHash) {
      return { status: "mismatch" }
    }
    if (record.response !== null) {
      return { status: "replayed", coin: deserializeCoin(record.response) }
    }

    const resolvedFields =
      prepareFields === undefined ? fields : await prepareFields()
    if (resolvedFields === undefined) {
      throw new Error("Coin create fields are required")
    }
    const createdCoin = await createCoinAggregate(resolvedFields, transaction)
    await transaction
      .update(maintenanceIdempotency)
      .set({ response: serializeCoin(createdCoin) })
      .where(
        and(
          eq(maintenanceIdempotency.collectorId, collectorId),
          eq(maintenanceIdempotency.operation, "coin.create"),
          eq(maintenanceIdempotency.key, idempotencyKey)
        )
      )
    return { status: "created", coin: createdCoin }
  })
}

function serializeCoin(record: Coin) {
  return {
    ...record,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}

function deserializeCoin(value: unknown): Coin {
  const record = value as ReturnType<typeof serializeCoin>
  return {
    ...record,
    createdAt: new Date(record.createdAt),
    updatedAt: new Date(record.updatedAt),
  }
}

export async function updateCoinMaintenance({
  id,
  ...fields
}: UpdateCoinMaintenanceInput) {
  return db.transaction(async (tx) => {
    const updatedCoins = await tx
      .update(coin)
      .set({
        ...normalizeCoinMaintenanceFields(fields),
        updatedAt: new Date(),
        version: sql`${coin.version} + 1`,
      })
      .where(eq(coin.id, id))
      .returning()
    const updatedCoin = updatedCoins.at(0)

    if (!updatedCoin) {
      return null
    }

    await replaceCoinRulers(id, fields.rulerIds, tx)
    await replaceCoinMints(id, fields.mintIds, tx)
    await replaceCoinThemes(id, fields.themeIds, tx)
    await replaceCoinReferences(id, getCoinReferences(fields), tx)
    await replaceCoinSurfaces(id, getCoinSurfaces(fields), tx)

    return updatedCoin
  })
}

export async function deleteCoinMaintenance({ id }: { id: string }) {
  return db.transaction(async (tx) => {
    const deletedCoins = await tx
      .delete(coin)
      .where(eq(coin.id, id))
      .returning()

    return deletedCoins.at(0) ?? null
  })
}
