import { count, eq } from "drizzle-orm"

import { db } from "../client"
import type { CoinMaintenanceDeleteSummary } from "../coin-maintenance-delete-summary"
import { coinMint } from "../schema/coin-mint"
import { coinReference } from "../schema/coin-reference"
import { coinRuler } from "../schema/coin-ruler"
import { coinSurface } from "../schema/coin-surface"
import { coinSurfaceEngraver } from "../schema/coin-surface-engraver"
import { coinTheme } from "../schema/coin-theme"

export async function getCoinMaintenanceDeleteSummary(
  coinId: string
): Promise<CoinMaintenanceDeleteSummary | null> {
  const coinRow = await db.query.coin.findFirst({
    columns: {
      id: true,
      title: true,
    },
    where: (record, { eq }) => eq(record.id, coinId),
  })

  if (!coinRow) {
    return null
  }

  const [
    rulerResult,
    mintResult,
    themeResult,
    referenceResult,
    surfaceResult,
    engraverResult,
  ] = await Promise.all([
    db.select({ count: count() }).from(coinRuler).where(eq(coinRuler.coinId, coinId)),
    db.select({ count: count() }).from(coinMint).where(eq(coinMint.coinId, coinId)),
    db.select({ count: count() }).from(coinTheme).where(eq(coinTheme.coinId, coinId)),
    db
      .select({ count: count() })
      .from(coinReference)
      .where(eq(coinReference.coinId, coinId)),
    db.select({ count: count() }).from(coinSurface).where(eq(coinSurface.coinId, coinId)),
    db
      .select({ count: count() })
      .from(coinSurfaceEngraver)
      .innerJoin(
        coinSurface,
        eq(coinSurface.id, coinSurfaceEngraver.coinSurfaceId)
      )
      .where(eq(coinSurface.coinId, coinId)),
  ])

  return {
    title: coinRow.title,
    rulerAttributions: rulerResult.at(0)?.count ?? 0,
    mintAttributions: mintResult.at(0)?.count ?? 0,
    themeAttributions: themeResult.at(0)?.count ?? 0,
    catalogueReferences: referenceResult.at(0)?.count ?? 0,
    coinSurfaces: surfaceResult.at(0)?.count ?? 0,
    engraverAttributions: engraverResult.at(0)?.count ?? 0,
  }
}
