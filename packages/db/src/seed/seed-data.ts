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
  weight?: string
  diameter?: string
  thickness?: string
  minYear?: number
  maxYear?: number
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
    title: "1881 Argentine 2 Centavos",
    distributionCode: "standard-circulation",
    issuerCode: "argentina",
    weight: "10.00",
    diameter: "30.00",
    thickness: "1.70",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  },
  {
    title: "1813 Buenos Aires 8 Reales",
    distributionCode: "standard-circulation",
    issuerCode: "buenos-aires",
    weight: "27.07",
    diameter: "38.00",
    thickness: "2.50",
    minYear: 1813,
    maxYear: 1813,
    createdAt: new Date("2026-01-02T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
  },
  {
    title: "1909 Lincoln Wheat Cent",
    distributionCode: "standard-circulation",
    issuerCode: "united-states",
    weight: "3.11",
    diameter: "19.05",
    thickness: "1.55",
    minYear: 1909,
    maxYear: 1909,
    createdAt: new Date("2026-01-03T00:00:00.000Z"),
    updatedAt: new Date("2026-01-03T00:00:00.000Z"),
  },
  {
    title: "1896 Argentine 20 Centavos",
    distributionCode: "standard-circulation",
    issuerCode: "argentina",
    diameter: "21.00",
    thickness: "1.40",
    minYear: 1896,
    maxYear: 1898,
    createdAt: new Date("2026-01-04T00:00:00.000Z"),
    updatedAt: new Date("2026-01-04T00:00:00.000Z"),
  },
  {
    title: "1822 Buenos Aires Decimo",
    distributionCode: "standard-circulation",
    issuerCode: "buenos-aires",
    weight: "1.35",
    thickness: "0.90",
    minYear: 1822,
    maxYear: 1823,
    createdAt: new Date("2026-01-05T00:00:00.000Z"),
    updatedAt: new Date("2026-01-05T00:00:00.000Z"),
  },
  {
    title: "2014 Kennedy Half Dollar",
    distributionCode: "standard-circulation",
    issuerCode: "united-states",
    weight: "11.34",
    diameter: "30.61",
    thickness: "2.15",
    minYear: 2014,
    maxYear: 2026,
    createdAt: new Date("2026-01-06T00:00:00.000Z"),
    updatedAt: new Date("2026-01-06T00:00:00.000Z"),
  },
  {
    title: "1992 Argentine 50 Centavos",
    distributionCode: "standard-circulation",
    issuerCode: "argentina",
    weight: "5.80",
    diameter: "25.20",
    thickness: "1.90",
    createdAt: new Date("2026-01-07T00:00:00.000Z"),
    updatedAt: new Date("2026-01-07T00:00:00.000Z"),
  },
  {
    title: "1793 Flowing Hair Cent",
    distributionCode: "standard-circulation",
    issuerCode: "united-states",
    weight: "13.48",
    diameter: "27.50",
    minYear: 1793,
    maxYear: 1793,
    createdAt: new Date("2026-01-08T00:00:00.000Z"),
    updatedAt: new Date("2026-01-08T00:00:00.000Z"),
  },
  {
    title: "1794 Flowing Hair Half Cent",
    distributionCode: "standard-circulation",
    issuerCode: "united-states",
    weight: "6.74",
    diameter: "23.50",
    thickness: "1.20",
    minYear: 1793,
    maxYear: 1795,
    createdAt: new Date("2026-01-09T00:00:00.000Z"),
    updatedAt: new Date("2026-01-09T00:00:00.000Z"),
  },
  {
    title: "2001 Argentine 1 Peso",
    distributionCode: "standard-circulation",
    issuerCode: "argentina",
    weight: "6.35",
    diameter: "23.00",
    thickness: "2.00",
    minYear: 2001,
    maxYear: 2001,
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
    coinTitle: "2014 Kennedy Half Dollar",
    rulerCode: "felipe-vi",
    rulerOrder: 1,
  },
  {
    coinTitle: "1794 Flowing Hair Half Cent",
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
    coinTitle: "2014 Kennedy Half Dollar",
    catalogueCode: "KM",
    number: "1338A",
    createdAt: new Date("2026-01-11T00:00:00.000Z"),
    updatedAt: new Date("2026-01-11T00:00:00.000Z"),
  },
]
