export type GetCoinsRow = {
  id: string
  title: string
  issuerId: string
  issuerCode: string
  issuerName: string
  issuerIsoCode: string
}

export type CoinIssuerParent = {
  id: string
  code: string
  name: string
  isoCode: string
  createdAt: Date
  updatedAt: Date
}

export type CoinIssuer = CoinIssuerParent & {
  parent: CoinIssuerParent | null
}

export type CoinListIssuer = Pick<
  CoinIssuer,
  "id" | "code" | "name" | "isoCode"
>

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
      name: row.issuerName,
      isoCode: row.issuerIsoCode,
    },
  }))
}
