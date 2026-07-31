import { and, asc, eq } from "drizzle-orm"

import { db } from "../client"
import type {
  CoinMaintenanceRecord,
  CoinMaintenanceSurfaceSet,
} from "../coin-maintenance-record"
import { coinSurface } from "../schema/coin-surface"
import { coinSurfaceEngraver } from "../schema/coin-surface-engraver"

type CoinMaintenanceSurfaceRow = {
  kind: "obverse" | "reverse" | "edge-surface"
  description: string | null
  lettering: string | null
  imageUrl: string | null
  engraverId: string | null
}

const EMPTY_COIN_MAINTENANCE_SURFACE_SET: CoinMaintenanceSurfaceSet = {
  obverse: null,
  reverse: null,
  edge: null,
}

function createCoinMaintenanceFaceSurface(row: CoinMaintenanceSurfaceRow) {
  return {
    description: row.description,
    lettering: row.lettering,
    imageUrl: row.imageUrl,
    engraverIds: [],
  }
}

function mapCoinMaintenanceSurfaces(
  rows: CoinMaintenanceSurfaceRow[]
): CoinMaintenanceSurfaceSet {
  const surfaces: CoinMaintenanceSurfaceSet = {
    ...EMPTY_COIN_MAINTENANCE_SURFACE_SET,
  }

  for (const row of rows) {
    if (row.kind === "edge-surface") {
      surfaces.edge = {
        description: row.description,
        lettering: row.lettering,
        imageUrl: row.imageUrl,
      }
      continue
    }

    const key = row.kind
    const currentSurface =
      surfaces[key] ?? createCoinMaintenanceFaceSurface(row)

    if (
      row.engraverId !== null &&
      !currentSurface.engraverIds.includes(row.engraverId)
    ) {
      currentSurface.engraverIds.push(row.engraverId)
    }

    surfaces[key] = currentSurface
  }

  return surfaces
}

export async function getCoinMaintenanceRecord(
  coinId: string
): Promise<CoinMaintenanceRecord | null> {
  const [coinRow, mintRows, rulerRows, themeRows, referenceRows, surfaceRows] =
    await Promise.all([
      db.query.coin.findFirst({
        columns: {
          id: true,
          title: true,
          comments: true,
          compositionDescription: true,
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
      db.query.coinMint.findMany({
        columns: {
          mintId: true,
        },
        where: (record, { eq }) => eq(record.coinId, coinId),
        orderBy: (record, { asc }) => asc(record.mintId),
      }),
      db.query.coinRuler.findMany({
        columns: {
          rulerId: true,
        },
        where: (record, { eq }) => eq(record.coinId, coinId),
        orderBy: (record, { asc }) => asc(record.rulerOrder),
      }),
      db.query.coinTheme.findMany({
        columns: {
          themeId: true,
        },
        where: (record, { eq }) => eq(record.coinId, coinId),
        orderBy: (record, { asc }) => asc(record.themeId),
      }),
      db.query.coinReference.findMany({
        columns: {
          catalogueId: true,
          number: true,
        },
        where: (record, { eq }) => eq(record.coinId, coinId),
        orderBy: (record, { asc }) => asc(record.catalogueId),
      }),
      db
        .select({
          kind: coinSurface.kind,
          description: coinSurface.description,
          lettering: coinSurface.lettering,
          imageUrl: coinSurface.imageUrl,
          engraverId: coinSurfaceEngraver.engraverId,
        })
        .from(coinSurface)
        .leftJoin(
          coinSurfaceEngraver,
          and(
            eq(coinSurfaceEngraver.coinSurfaceId, coinSurface.id),
            eq(coinSurfaceEngraver.coinSurfaceKind, coinSurface.kind)
          )
        )
        .where(eq(coinSurface.coinId, coinId))
        .orderBy(asc(coinSurface.kind), asc(coinSurfaceEngraver.engraverId)),
    ])

  if (!coinRow) {
    return null
  }

  return {
    ...coinRow,
    mintIds: mintRows.map(({ mintId }) => mintId),
    rulerIds: rulerRows.map(({ rulerId }) => rulerId),
    themeIds: themeRows.map(({ themeId }) => themeId),
    references: referenceRows.map((reference) => ({
      catalogueId: reference.catalogueId,
      number: reference.number,
    })),
    surfaces: mapCoinMaintenanceSurfaces(surfaceRows),
  }
}
