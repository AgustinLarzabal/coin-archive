import type { CoinListIssuer } from "./coin-issuer-record"

export type GetCoinsRow = {
  id: string
  title: string
  issuerId: string
  issuerCode: string
  issuerIsoCode: string
  issuerName: string
}

export type CoinListRecord = {
  id: string
  title: string
  issuer: CoinListIssuer
}

export function mapGetCoinsRowsToCoinRecords(
  rows: GetCoinsRow[]
): CoinListRecord[] {
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    issuer: {
      id: row.issuerId,
      code: row.issuerCode,
      isoCode: row.issuerIsoCode,
      name: row.issuerName,
    },
  }))
}
