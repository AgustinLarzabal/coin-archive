import { db } from "../client"

export type CoinMaintenanceRecord = {
  id: string
  title: string
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
  rulerId: string | null
  shapeId: string | null
  techniqueId: string | null
  thickness: number | null
  weight: number | null
}

export async function getCoinMaintenanceRecord(
  coinId: string
): Promise<CoinMaintenanceRecord | null> {
  const [coinRow, rulerRows] = await Promise.all([
    db.query.coin.findFirst({
      columns: {
        id: true,
        title: true,
        comments: true,
        compositionId: true,
        currencyId: true,
        diameter: true,
        distributionId: true,
        edgeId: true,
        faceValueNumericValue: true,
        faceValueText: true,
        isDemonetized: true,
        issuerId: true,
        maxYear: true,
        minYear: true,
        mintage: true,
        orientationId: true,
        rimId: true,
        shapeId: true,
        techniqueId: true,
        thickness: true,
        weight: true,
      },
      where: (record, { eq }) => eq(record.id, coinId),
    }),
    db.query.coinRuler.findMany({
      columns: {
        rulerId: true,
      },
      where: (record, { eq }) => eq(record.coinId, coinId),
      orderBy: (record, { asc }) => asc(record.rulerOrder),
    }),
  ])

  if (!coinRow) {
    return null
  }

  return {
    ...coinRow,
    rulerId: rulerRows.at(0)?.rulerId ?? null,
  }
}
