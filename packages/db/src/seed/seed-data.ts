import type { CoinFaceSide } from "../schema/coin-face"

type SeededIssuer = {
  name: string
  code: string
  parentCode?: string
  createdAt: Date
  updatedAt: Date
}

export type SeededCoin = {
  comments?: string | null
  title: string
  compositionCode: string
  currencyCode: string
  distributionCode: string
  edgeCode?: string
  edgeDescription?: string
  edgeLettering?: string
  faceValueNumericValue: number
  faceValueText: string
  issuerCode: string
  orientationCode?: string
  rimCode?: string
  shapeCode?: string
  techniqueCode?: string
  weight?: number
  diameter?: number
  thickness?: number
  minYear?: number
  maxYear?: number
  createdAt: Date
  updatedAt: Date
}

type SeededCoinFace = {
  coinTitle: string
  side: CoinFaceSide
  description?: string | null
  lettering?: string | null
}

type SeededEngraver = {
  code: string
  name: string
  createdAt: Date
  updatedAt: Date
}

type SeededCoinFaceEngraver = {
  coinTitle: string
  side: CoinFaceSide
  engraverCode: string
}

type SeededMint = {
  code: string
  name: string
  createdAt: Date
  updatedAt: Date
}

type SeededOrientation = {
  code: string
  name: string
  createdAt: Date
  updatedAt: Date
}

type SeededTheme = {
  code: string
  name: string
  createdAt: Date
  updatedAt: Date
}

type SeededTechnique = {
  code: string
  name: string
  createdAt: Date
  updatedAt: Date
}

type SeededShape = {
  code: string
  name: string
  createdAt: Date
  updatedAt: Date
}

type SeededRim = {
  code: string
  name: string
  createdAt: Date
  updatedAt: Date
}

type SeededTechnique = {
  code: string
  name: string
  createdAt: Date
  updatedAt: Date
}

type SeededEdge = {
  code: string
  name: string
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

type SeededCoinMint = {
  coinTitle: string
  mintCode: string
}

type SeededCoinTheme = {
  coinTitle: string
  themeCode: string
}

type SeededCurrency = {
  code: string
  fullName: string
  name: string
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
  {
    name: "Spain",
    code: "spain",
    createdAt: new Date("2026-01-04T00:00:00.000Z"),
    updatedAt: new Date("2026-01-04T00:00:00.000Z"),
  },
]

export const seededCoins: SeededCoin[] = [
  {
    title: "Argentina Sol de Mayo Peso",
    compositionCode: "silver-900",
    currencyCode: "argentine-peso",
    distributionCode: "standard-circulation",
    faceValueNumericValue: 1,
    faceValueText: "1 Peso",
    issuerCode: "argentina",
    orientationCode: "coin-alignment",
    shapeCode: "round",
    rimCode: "raised-both-sides",
    techniqueCode: "milled",
    weight: 12.5,
    diameter: 31.5,
    thickness: 2.4,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  },
  {
    title: "Buenos Aires 8 Reales 1813",
    compositionCode: "silver-900",
    currencyCode: "real",
    distributionCode: "standard-circulation",
    faceValueNumericValue: 8,
    faceValueText: "8 Reales",
    issuerCode: "buenos-aires",
    orientationCode: "coin-alignment",
    shapeCode: "round",
    rimCode: "raised-both-sides",
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
    currencyCode: "united-states-dollar",
    distributionCode: "standard-circulation",
    faceValueNumericValue: 0.01,
    faceValueText: "1 Cent",
    issuerCode: "united-states",
    orientationCode: "coin-alignment",
    techniqueCode: "milled",
    shapeCode: "round",
    rimCode: "plain",
    techniqueCode: "milled",
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
    currencyCode: "argentine-peso",
    distributionCode: "standard-circulation",
    faceValueNumericValue: 0.2,
    faceValueText: "20 Centavos",
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
    currencyCode: "real",
    distributionCode: "standard-circulation",
    faceValueNumericValue: 0.5,
    faceValueText: "5 Decimos",
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
    currencyCode: "united-states-dollar",
    distributionCode: "standard-circulation",
    faceValueNumericValue: 0.25,
    faceValueText: "Quarter Dollar",
    issuerCode: "united-states",
    orientationCode: "coin-alignment",
    techniqueCode: "milled",
    shapeCode: "round",
    rimCode: "raised-both-sides",
    techniqueCode: "milled",
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
    currencyCode: "argentine-peso",
    distributionCode: "standard-circulation",
    faceValueNumericValue: 1,
    faceValueText: "1 Peso",
    issuerCode: "argentina",
    diameter: 22,
    createdAt: new Date("2026-01-07T00:00:00.000Z"),
    updatedAt: new Date("2026-01-07T00:00:00.000Z"),
  },
  {
    title: "Buenos Aires Transition Half Real",
    compositionCode: "silver-900",
    currencyCode: "real",
    distributionCode: "standard-circulation",
    faceValueNumericValue: 0.5,
    faceValueText: "Half Real",
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
    currencyCode: "united-states-dollar",
    distributionCode: "standard-circulation",
    faceValueNumericValue: 1,
    faceValueText: "1 Dollar",
    issuerCode: "united-states",
    orientationCode: "coin-alignment",
    shapeCode: "round",
    rimCode: "lettered",
    techniqueCode: "milled",
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
    comments: null,
    compositionCode: "copper-nickel",
    currencyCode: "argentine-peso",
    distributionCode: "standard-circulation",
    faceValueNumericValue: 1,
    faceValueText: "1 Peso",
    issuerCode: "argentina",
    techniqueCode: "milled",
    weight: 6.35,
    diameter: 23.5,
    thickness: 1.9,
    minYear: 2001,
    maxYear: 2001,
    createdAt: new Date("2026-01-10T00:00:00.000Z"),
    updatedAt: new Date("2026-01-10T00:00:00.000Z"),
  },
  {
    title: "Spain 2 Euro",
    comments:
      "Common circulating commemorative format with a national obverse and shared euro reverse.",
    compositionCode: "copper-nickel-clad",
    currencyCode: "euro",
    distributionCode: "circulating-commemorative",
    edgeCode: "lettered",
    edgeDescription: "Finely reeded with incuse lettering.",
    edgeLettering: "2 **",
    faceValueNumericValue: 2,
    faceValueText: "2 Euros",
    issuerCode: "spain",
    orientationCode: "medal-alignment",
    techniqueCode: "milled",
    shapeCode: "round",
    rimCode: "raised-both-sides",
    techniqueCode: "milled",
    weight: 8.5,
    diameter: 25.75,
    thickness: 2.2,
    minYear: 2002,
    maxYear: 2026,
    createdAt: new Date("2026-01-11T00:00:00.000Z"),
    updatedAt: new Date("2026-01-11T00:00:00.000Z"),
  },
]

export const seededCoinFaces: SeededCoinFace[] = [
  {
    coinTitle: "Spain 2 Euro",
    side: "obverse",
    description: "Portrait of Felipe VI facing left.",
    lettering: "FELIPE VI REY DE ESPANA",
  },
  {
    coinTitle: "Spain 2 Euro",
    side: "reverse",
    description: "Map of Europe with denomination.",
    lettering: "2 EURO",
  },
]

export const seededEngravers: SeededEngraver[] = [
  {
    code: "georgios-stamatopoulos",
    name: "Georgios Stamatópoulos",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  },
]

export const seededCoinFaceEngravers: SeededCoinFaceEngraver[] = [
  {
    coinTitle: "Spain 2 Euro",
    side: "reverse",
    engraverCode: "georgios-stamatopoulos",
  },
]

export const seededMints: SeededMint[] = [
  {
    code: "royal-mint-of-madrid",
    name: "Royal Mint of Madrid",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  },
  {
    code: "buenos-aires-mint",
    name: "Buenos Aires Mint",
    createdAt: new Date("2026-01-02T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
  },
  {
    code: "philadelphia-mint",
    name: "Philadelphia Mint",
    createdAt: new Date("2026-01-03T00:00:00.000Z"),
    updatedAt: new Date("2026-01-03T00:00:00.000Z"),
  },
  {
    code: "denver-mint",
    name: "Denver Mint",
    createdAt: new Date("2026-01-04T00:00:00.000Z"),
    updatedAt: new Date("2026-01-04T00:00:00.000Z"),
  },
]

export const seededOrientations: SeededOrientation[] = [
  {
    code: "coin-alignment",
    name: "Coin alignment",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  },
  {
    code: "medal-alignment",
    name: "Medal alignment",
    createdAt: new Date("2026-01-02T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
  },
]

export const seededThemes: SeededTheme[] = [
  {
    code: "animal",
    name: "Animal",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  },
  {
    code: "building",
    name: "Building",
    createdAt: new Date("2026-01-02T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
  },
  {
    code: "flag",
    name: "Flag",
    createdAt: new Date("2026-01-03T00:00:00.000Z"),
    updatedAt: new Date("2026-01-03T00:00:00.000Z"),
  },
  {
    code: "independence",
    name: "Independence",
    createdAt: new Date("2026-01-04T00:00:00.000Z"),
    updatedAt: new Date("2026-01-04T00:00:00.000Z"),
  },
  {
    code: "map",
    name: "Map",
    createdAt: new Date("2026-01-05T00:00:00.000Z"),
    updatedAt: new Date("2026-01-05T00:00:00.000Z"),
  },
  {
    code: "plant",
    name: "Plant",
    createdAt: new Date("2026-01-06T00:00:00.000Z"),
    updatedAt: new Date("2026-01-06T00:00:00.000Z"),
  },
  {
    code: "portrait",
    name: "Portrait",
    createdAt: new Date("2026-01-07T00:00:00.000Z"),
    updatedAt: new Date("2026-01-07T00:00:00.000Z"),
  },
]

export const seededTechniques: SeededTechnique[] = [
  {
    code: "cast",
    name: "Cast",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  },
  {
    code: "hammered",
    name: "Hammered",
    createdAt: new Date("2026-01-02T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
  },
  {
    code: "milled",
    name: "Milled",
    createdAt: new Date("2026-01-03T00:00:00.000Z"),
    updatedAt: new Date("2026-01-03T00:00:00.000Z"),
  },
]

export const seededShapes: SeededShape[] = [
  {
    code: "round",
    name: "Round",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  },
  {
    code: "scalloped",
    name: "Scalloped",
    createdAt: new Date("2026-01-02T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
  },
] as const

export const seededRims: SeededRim[] = [
  {
    code: "lettered",
    name: "Lettered",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  },
  {
    code: "plain",
    name: "Plain",
    createdAt: new Date("2026-01-02T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
  },
  {
    code: "raised-both-sides",
    name: "Raised, both sides",
    createdAt: new Date("2026-01-03T00:00:00.000Z"),
    updatedAt: new Date("2026-01-03T00:00:00.000Z"),
  },
] as const

export const seededEdges: SeededEdge[] = [
  {
    code: "lettered",
    name: "Lettered",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  },
  {
    code: "reeded",
    name: "Reeded",
    createdAt: new Date("2026-01-02T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
  },
] as const

export const seededCurrencies: SeededCurrency[] = [
  {
    code: "euro",
    name: "Euro",
    fullName: "Euro (2002-date)",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  },
  {
    code: "argentine-peso",
    name: "Argentine peso",
    fullName: "Argentine peso",
    createdAt: new Date("2026-01-02T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
  },
  {
    code: "real",
    name: "Real",
    fullName: "Real",
    createdAt: new Date("2026-01-03T00:00:00.000Z"),
    updatedAt: new Date("2026-01-03T00:00:00.000Z"),
  },
  {
    code: "united-states-dollar",
    name: "United States dollar",
    fullName: "United States dollar",
    createdAt: new Date("2026-01-04T00:00:00.000Z"),
    updatedAt: new Date("2026-01-04T00:00:00.000Z"),
  },
]

export const seededTechniques: SeededTechnique[] = [
  {
    code: "cast",
    name: "Cast",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  },
  {
    code: "hammered",
    name: "Hammered",
    createdAt: new Date("2026-01-02T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
  },
  {
    code: "milled",
    name: "Milled",
    createdAt: new Date("2026-01-03T00:00:00.000Z"),
    updatedAt: new Date("2026-01-03T00:00:00.000Z"),
  },
]

export const seededCoinMints: SeededCoinMint[] = [
  {
    coinTitle: "Spain 2 Euro",
    mintCode: "royal-mint-of-madrid",
  },
  {
    coinTitle: "Buenos Aires 8 Reales 1813",
    mintCode: "buenos-aires-mint",
  },
  {
    coinTitle: "United States Lincoln Cent",
    mintCode: "philadelphia-mint",
  },
  {
    coinTitle: "United States National Park Quarter",
    mintCode: "philadelphia-mint",
  },
  {
    coinTitle: "United States National Park Quarter",
    mintCode: "denver-mint",
  },
]

export const seededCoinThemes: SeededCoinTheme[] = [
  {
    coinTitle: "Argentina Sol de Mayo Peso",
    themeCode: "flag",
  },
  {
    coinTitle: "Buenos Aires 8 Reales 1813",
    themeCode: "independence",
  },
  {
    coinTitle: "United States Lincoln Cent",
    themeCode: "portrait",
  },
  {
    coinTitle: "Argentina 20 Centavos",
    themeCode: "plant",
  },
  {
    coinTitle: "United States National Park Quarter",
    themeCode: "animal",
  },
  {
    coinTitle: "United States National Park Quarter",
    themeCode: "plant",
  },
  {
    coinTitle: "United States Flowing Hair Dollar",
    themeCode: "portrait",
  },
  {
    coinTitle: "Spain 2 Euro",
    themeCode: "building",
  },
  {
    coinTitle: "Spain 2 Euro",
    themeCode: "map",
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
    coinTitle: "Spain 2 Euro",
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
    coinTitle: "Spain 2 Euro",
    catalogueCode: "KM",
    number: "1338A",
    createdAt: new Date("2026-01-11T00:00:00.000Z"),
    updatedAt: new Date("2026-01-11T00:00:00.000Z"),
  },
]
