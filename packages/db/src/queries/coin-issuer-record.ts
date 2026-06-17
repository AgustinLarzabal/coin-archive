export type CoinIssuerSummary = {
  id: string
  code: string
  name: string
  isoCode: string
}

export type CoinIssuer = CoinIssuerSummary & {
  parent: CoinIssuerSummary | null
}

export type CoinListIssuer = CoinIssuerSummary
