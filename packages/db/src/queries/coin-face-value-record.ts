export type CoinCurrencyRecord = {
  code: string
  name: string
  fullName: string
}

export type CoinFaceValueRecord = {
  text: string
  numericValue: number
  currency: CoinCurrencyRecord
}
