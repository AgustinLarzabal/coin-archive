type SeededIssuer = {
  name: string
  code: string
  parentCode?: string
  createdAt: Date
  updatedAt: Date
}

type SeededCoin = {
  title: string
  compositionCode: string
  distributionCode: string
  issuerCode: string
  weight?: number
  diameter?: number
  thickness?: number
  minYear?: number
  maxYear?: number
  createdAt: Date
  updatedAt: Date
}

type SeededComposition = {
  code: string
  name: string
  description?: string | null
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
    title: "Argentina Sol de Mayo Peso",
    compositionCode: "silver-900",
    distributionCode: "standard-circulation",
    issuerCode: "argentina",
    weight: 12.5,
    diameter: 31.5,
    thickness: 2.4,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  },
  {
    title: "Buenos Aires 8 Reales 1813",
    compositionCode: "silver-900",
    distributionCode: "standard-circulation",
    issuerCode: "buenos-aires",
    weight: 26.95,
    diameter: 37.5,
    thickness: 2.1,
    minYear: 1813,
    maxYear: 1813,
    createdAt: new Date("2026-01-02T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
  },
  {
    title: "United States Lincoln Cent",
    compositionCode: "copper",
    distributionCode: "standard-circulation",
    issuerCode: "united-states",
    weight: 3.11,
    diameter: 19.05,
    minYear: 1909,
    maxYear: 1909,
    createdAt: new Date("2026-01-03T00:00:00.000Z"),
    updatedAt: new Date("2026-01-03T00:00:00.000Z"),
  },
  {
    title: "Argentina 20 Centavos",
    compositionCode: "copper-nickel",
    distributionCode: "standard-circulation",
    issuerCode: "argentina",
    weight: 10,
    diameter: 27,
    thickness: 2.2,
    minYear: 1896,
    maxYear: 1898,
    createdAt: new Date("2026-01-04T00:00:00.000Z"),
    updatedAt: new Date("2026-01-04T00:00:00.000Z"),
  },
  {
    title: "Buenos Aires 5 Decimos",
    compositionCode: "silver-900",
    distributionCode: "standard-circulation",
    issuerCode: "buenos-aires",
    weight: 8.5,
    diameter: 24,
    thickness: 1.7,
    minYear: 1822,
    maxYear: 1823,
    createdAt: new Date("2026-01-05T00:00:00.000Z"),
    updatedAt: new Date("2026-01-05T00:00:00.000Z"),
  },
  {
    title: "United States National Park Quarter",
    compositionCode: "copper-nickel-clad",
    distributionCode: "standard-circulation",
    issuerCode: "united-states",
    weight: 8.1,
    diameter: 26.5,
    thickness: 2,
    minYear: 2014,
    maxYear: 2026,
    createdAt: new Date("2026-01-06T00:00:00.000Z"),
    updatedAt: new Date("2026-01-06T00:00:00.000Z"),
  },
  {
    title: "Argentina Copper Peso",
    compositionCode: "copper",
    distributionCode: "standard-circulation",
    issuerCode: "argentina",
    diameter: 22,
    createdAt: new Date("2026-01-07T00:00:00.000Z"),
    updatedAt: new Date("2026-01-07T00:00:00.000Z"),
  },
  {
    title: "Buenos Aires Transition Half Real",
    compositionCode: "silver-900",
    distributionCode: "standard-circulation",
    issuerCode: "buenos-aires",
    weight: 3.8,
    diameter: 18.5,
    thickness: 1.4,
    minYear: -2,
    maxYear: 0,
    createdAt: new Date("2026-01-08T00:00:00.000Z"),
    updatedAt: new Date("2026-01-08T00:00:00.000Z"),
  },
  {
    title: "United States Flowing Hair Dollar",
    compositionCode: "silver-900",
    distributionCode: "standard-circulation",
    issuerCode: "united-states",
    weight: 26.73,
    diameter: 39,
    thickness: 2.9,
    minYear: 1793,
    maxYear: 1795,
    createdAt: new Date("2026-01-09T00:00:00.000Z"),
    updatedAt: new Date("2026-01-09T00:00:00.000Z"),
  },
  {
    title: "Argentina Convertible Peso",
    compositionCode: "copper-nickel",
    distributionCode: "standard-circulation",
    issuerCode: "argentina",
    weight: 6.35,
    diameter: 23.5,
    thickness: 1.9,
    minYear: 2001,
    maxYear: 2001,
    createdAt: new Date("2026-01-10T00:00:00.000Z"),
    updatedAt: new Date("2026-01-10T00:00:00.000Z"),
  },
]

export const seededCompositions: SeededComposition[] = [
  {
    code: "silver-900",
    name: "Silver (.900)",
    description: "Ninety percent silver alloy.",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  },
  {
    code: "copper",
    name: "Copper",
    description: null,
    createdAt: new Date("2026-01-02T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
  },
  {
    code: "copper-nickel",
    name: "Copper-nickel",
    description: null,
    createdAt: new Date("2026-01-03T00:00:00.000Z"),
    updatedAt: new Date("2026-01-03T00:00:00.000Z"),
  },
  {
    code: "copper-nickel-clad",
    name: "Copper-nickel clad",
    description: "Copper core with copper-nickel outer layers.",
    createdAt: new Date("2026-01-04T00:00:00.000Z"),
    updatedAt: new Date("2026-01-04T00:00:00.000Z"),
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
    coinTitle: "United States National Park Quarter",
    rulerCode: "felipe-vi",
    rulerOrder: 1,
  },
  {
    coinTitle: "United States Flowing Hair Dollar",
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
    coinTitle: "United States National Park Quarter",
    catalogueCode: "KM",
    number: "1338A",
    createdAt: new Date("2026-01-11T00:00:00.000Z"),
    updatedAt: new Date("2026-01-11T00:00:00.000Z"),
  },
]
