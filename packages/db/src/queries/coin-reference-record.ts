export type CoinReferenceCatalogueRecord = {
  code: string
  title: string
}

export type CoinReferenceRecord = {
  catalogue: CoinReferenceCatalogueRecord
  number: string
}
