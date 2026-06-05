type SeededIssuer = {
  name: string
  code: string
  parentCode?: string
  createdAt: Date
  updatedAt: Date
}

type SeededCoin = {
  title: string
  distributionCode: string
  issuerCode: string
  createdAt: Date
  updatedAt: Date
}

type SeededRulerGroup = {
  name: string
  code: string
  createdAt: Date
  updatedAt: Date
}

type SeededRuler = {
  name: string
  code: string
  rulerGroupCode?: string
  createdAt: Date
  updatedAt: Date
}

type SeededCoinRuler = {
  coinTitle: string
  rulerCode: string
  rulerOrder: number
}

type SeededCatalogue = {
  code: string
  title: string
  createdAt: Date
  updatedAt: Date
}

type SeededDistribution = {
  code: string
  name: string
  createdAt: Date
  updatedAt: Date
}

type SeededCoinReference = {
  coinTitle: string
  catalogueCode: string
  number: string
  createdAt: Date
  updatedAt: Date
}

export const seededIssuers: SeededIssuer[] = [
  {
    name: "Argentina",
    code: "argentina",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  },
  {
    name: "Buenos Aires",
    code: "buenos-aires",
    parentCode: "argentina",
    createdAt: new Date("2026-01-02T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
  },
  {
    name: "United States of America",
    code: "united-states",
    createdAt: new Date("2026-01-03T00:00:00.000Z"),
    updatedAt: new Date("2026-01-03T00:00:00.000Z"),
  },
]

export const seededCoins: SeededCoin[] = [
  {
    title: "Seed Coin 01",
    distributionCode: "standard-circulation",
    issuerCode: "argentina",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  },
  {
    title: "Seed Coin 02",
    distributionCode: "standard-circulation",
    issuerCode: "buenos-aires",
    createdAt: new Date("2026-01-02T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
  },
  {
    title: "Seed Coin 03",
    distributionCode: "standard-circulation",
    issuerCode: "united-states",
    createdAt: new Date("2026-01-03T00:00:00.000Z"),
    updatedAt: new Date("2026-01-03T00:00:00.000Z"),
  },
  {
    title: "Seed Coin 04",
    distributionCode: "standard-circulation",
    issuerCode: "argentina",
    createdAt: new Date("2026-01-04T00:00:00.000Z"),
    updatedAt: new Date("2026-01-04T00:00:00.000Z"),
  },
  {
    title: "Seed Coin 05",
    distributionCode: "standard-circulation",
    issuerCode: "buenos-aires",
    createdAt: new Date("2026-01-05T00:00:00.000Z"),
    updatedAt: new Date("2026-01-05T00:00:00.000Z"),
  },
  {
    title: "Seed Coin 06",
    distributionCode: "standard-circulation",
    issuerCode: "united-states",
    createdAt: new Date("2026-01-06T00:00:00.000Z"),
    updatedAt: new Date("2026-01-06T00:00:00.000Z"),
  },
  {
    title: "Seed Coin 07",
    distributionCode: "standard-circulation",
    issuerCode: "argentina",
    createdAt: new Date("2026-01-07T00:00:00.000Z"),
    updatedAt: new Date("2026-01-07T00:00:00.000Z"),
  },
  {
    title: "Seed Coin 08",
    distributionCode: "standard-circulation",
    issuerCode: "buenos-aires",
    createdAt: new Date("2026-01-08T00:00:00.000Z"),
    updatedAt: new Date("2026-01-08T00:00:00.000Z"),
  },
  {
    title: "Seed Coin 09",
    distributionCode: "standard-circulation",
    issuerCode: "united-states",
    createdAt: new Date("2026-01-09T00:00:00.000Z"),
    updatedAt: new Date("2026-01-09T00:00:00.000Z"),
  },
  {
    title: "Seed Coin 10",
    distributionCode: "standard-circulation",
    issuerCode: "argentina",
    createdAt: new Date("2026-01-10T00:00:00.000Z"),
    updatedAt: new Date("2026-01-10T00:00:00.000Z"),
  },
]

export const seededDistributions: SeededDistribution[] = [
  {
    code: "standard-circulation",
    name: "Standard circulation",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  },
  {
    code: "circulating-commemorative",
    name: "Circulating commemorative",
    createdAt: new Date("2026-01-02T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
  },
]

export const seededRulerGroups: SeededRulerGroup[] = [
  {
    name: "House of Bourbon",
    code: "house-of-bourbon",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  },
]

export const seededRulers: SeededRuler[] = [
  {
    name: "Felipe VI",
    code: "felipe-vi",
    rulerGroupCode: "house-of-bourbon",
    createdAt: new Date("2026-01-02T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
  },
  {
    name: "Liberty",
    code: "liberty",
    createdAt: new Date("2026-01-03T00:00:00.000Z"),
    updatedAt: new Date("2026-01-03T00:00:00.000Z"),
  },
]

export const seededCoinRulers: SeededCoinRuler[] = [
  {
    coinTitle: "Seed Coin 06",
    rulerCode: "felipe-vi",
    rulerOrder: 1,
  },
  {
    coinTitle: "Seed Coin 09",
    rulerCode: "liberty",
    rulerOrder: 1,
  },
]

export const seededCatalogues: SeededCatalogue[] = [
  {
    code: "KM",
    title: "Standard Catalog of World Coins",
    createdAt: new Date("2026-01-11T00:00:00.000Z"),
    updatedAt: new Date("2026-01-11T00:00:00.000Z"),
  },
]

export const seededCoinReferences: SeededCoinReference[] = [
  {
    coinTitle: "Seed Coin 06",
    catalogueCode: "KM",
    number: "1338A",
    createdAt: new Date("2026-01-11T00:00:00.000Z"),
    updatedAt: new Date("2026-01-11T00:00:00.000Z"),
  },
]
