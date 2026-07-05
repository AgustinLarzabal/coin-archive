import { eq } from "drizzle-orm"

import { db } from "../client"
import { normalizeCoinComments } from "../normalize-coin-comments"
import { coin } from "../schema/coin"
import { coinRuler } from "../schema/coin-ruler"

type CoinMaintenanceFields = {
  comments: string | null
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
  minYear: number | null
  mintage: number | null
  orientationId: string | null
  rimId: string | null
  rulerId: string
  shapeId: string | null
  techniqueId: string | null
  thickness: number | null
  title: string
  weight: number | null
}

type CreateCoinMaintenanceInput = CoinMaintenanceFields

type UpdateCoinMaintenanceInput = CoinMaintenanceFields & {
  id: string
}

function normalizeCoinMaintenanceFields(fields: CoinMaintenanceFields) {
  return {
    comments: normalizeCoinComments(fields.comments),
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

export async function createCoinMaintenance(
  fields: CreateCoinMaintenanceInput
) {
  return db.transaction(async (tx) => {
    const [createdCoin] = await tx
      .insert(coin)
      .values(normalizeCoinMaintenanceFields(fields))
      .returning()

    await tx.insert(coinRuler).values({
      coinId: createdCoin.id,
      rulerId: fields.rulerId,
      rulerOrder: 1,
    })

    return createdCoin
  })
}

export async function updateCoinMaintenance({
  id,
  ...fields
}: UpdateCoinMaintenanceInput) {
  return db.transaction(async (tx) => {
    const [updatedCoin] = await tx
      .update(coin)
      .set({
        ...normalizeCoinMaintenanceFields(fields),
        updatedAt: new Date(),
      })
      .where(eq(coin.id, id))
      .returning()

    if (!updatedCoin) {
      return null
    }

    await tx.delete(coinRuler).where(eq(coinRuler.coinId, id))
    await tx.insert(coinRuler).values({
      coinId: id,
      rulerId: fields.rulerId,
      rulerOrder: 1,
    })

    return updatedCoin
  })
}
