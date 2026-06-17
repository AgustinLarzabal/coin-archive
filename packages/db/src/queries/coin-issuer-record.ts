export type CoinIssuerSummary = {
  id: string
  code: string
  isoCode: string
  name: string
}

export type CoinIssuer = CoinIssuerSummary & {
  parent: CoinIssuerSummary | null
}

export type CoinListIssuer = CoinIssuerSummary
