import { eq } from "drizzle-orm"
import { db } from "../client"
import { coin } from "../schema/coin"
import { issuer } from "../schema/issuer"

export type CoinDetail = {
  id: string
  title: string
  issuer: {
    id: string
    code: string
    isoCode: string
    name: string
  }
}

function mapCoinDetail(row: {
  id: string
  title: string
  issuerId: string
  issuerCode: string
  issuerIsoCode: string
  issuerName: string
}): CoinDetail {
  return {
    id: row.id,
    title: row.title,
    issuer: {
      id: row.issuerId,
      code: row.issuerCode,
      isoCode: row.issuerIsoCode,
      name: row.issuerName,
    },
  }
}

export function buildGetCoinQuery(database: typeof db, coinId: string) {
  return database
    .select({
      id: coin.id,
      title: coin.title,
      issuerId: issuer.id,
      issuerCode: issuer.code,
      issuerIsoCode: issuer.isoCode,
      issuerName: issuer.name,
    })
    .from(coin)
    .innerJoin(issuer, eq(coin.issuerId, issuer.id))
    .where(eq(coin.id, coinId))
    .limit(1)
}

export async function getCoin(coinId: string): Promise<CoinDetail | null> {
  const rows = await buildGetCoinQuery(db, coinId)

  if (rows.length === 0) {
    return null
  }

  return mapCoinDetail(rows[0])
}
