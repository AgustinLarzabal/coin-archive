import { eq } from "drizzle-orm"
import { db } from "../client"
import { coin } from "../schema/coin"
import { issuer } from "../schema/issuer"
import type { CoinIssuer } from "./coin-issuer-record"

export type CoinDetailRecord = {
  id: string
  title: string
  issuer: CoinIssuer
}

type GetCoinRow = {
  id: string
  title: string
  issuerId: string
  issuerCode: string
  issuerIsoCode: string
  issuerName: string
}

function mapIssuer(row: GetCoinRow): CoinIssuer {
  return {
    id: row.issuerId,
    code: row.issuerCode,
    isoCode: row.issuerIsoCode,
    name: row.issuerName,
    parent: null,
  }
}

function mapCoinDetail(rows: GetCoinRow[]): CoinDetailRecord | null {
  const [firstRow] = rows

  if (!firstRow) {
    return null
  }

  const detail: CoinDetailRecord = {
    id: firstRow.id,
    title: firstRow.title,
    issuer: mapIssuer(firstRow),
  }

  return detail
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
}

export async function getCoin(
  coinId: string
): Promise<CoinDetailRecord | null> {
  const rows = await buildGetCoinQuery(db, coinId)

  return mapCoinDetail(rows)
}
