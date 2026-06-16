import type {
  CoinSurfaceKind,
  EngravableCoinSurfaceKind,
} from "../schema/coin-surface"

type SeededCatalogue = {
  code: string
  title: string
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

type SeededCurrency = {
  code: string
  name: string
  fullName: string
  createdAt: Date
  updatedAt: Date
}

type SeededDistribution = {
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

type SeededEngraver = {
  code: string
  name: string
  createdAt: Date
  updatedAt: Date
}

type SeededIssuer = {
  code: string
  name: string
  isoCode: string
  parentCode?: string
  createdAt: Date
  updatedAt: Date
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

type SeededRim = {
  code: string
  name: string
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

type SeededShape = {
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

type SeededTheme = {
  code: string
  name: string
  createdAt: Date
  updatedAt: Date
}

type SeededCoinMint = {
  coinTitle: string
  mintCode: string
}

type SeededCoinReference = {
  coinTitle: string
  catalogueCode: string
  number: string
  createdAt: Date
  updatedAt: Date
}

type SeededCoinRuler = {
  coinTitle: string
  rulerCode: string
  rulerOrder: number
}

type SeededCoinSurfaceEngraver = {
  coinTitle: string
  coinSurfaceKind: EngravableCoinSurfaceKind
  engraverCode: string
}

export type SeededCoinSurfaceDetails = {
  kind: CoinSurfaceKind
  description?: string | null
  lettering?: string | null
  thumbnailUrl?: string | null
  imageUrl?: string | null
}

type SeededCoinSurface = SeededCoinSurfaceDetails & {
  coinTitle: string
}

type SeededCoinTheme = {
  coinTitle: string
  themeCode: string
}

export type SeededCoin = {
  comments?: string | null
  compositionCode: string
  currencyCode: string
  diameter?: number
  distributionCode: string
  edgeCode?: string
  faceValueNumericValue: number
  faceValueText: string
  isDemonetized?: boolean | null
  issuerCode: string
  maxYear?: number
  minYear?: number
  mintage?: number | null
  orientationCode?: string
  rimCode?: string
  shapeCode?: string
  techniqueCode?: string
  thickness?: number
  title: string
  weight?: number
  createdAt: Date
  updatedAt: Date
}

export const seededCatalogues: SeededCatalogue[] = [
  {
    code: "KM",
    title: "Standard Catalog of World Coins",
    createdAt: new Date("2026-01-11T00:00:00.000Z"),
    updatedAt: new Date("2026-01-11T00:00:00.000Z"),
  },
  {
    code: "CA",
    title: "Coin Archive Code",
    createdAt: new Date("2026-01-11T00:00:00.000Z"),
    updatedAt: new Date("2026-01-11T00:00:00.000Z"),
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
  {
    code: "bimetallic",
    name: "Bimetallic",
    description: "Bimetallic description",
    createdAt: new Date("2026-01-04T00:00:00.000Z"),
    updatedAt: new Date("2026-01-04T00:00:00.000Z"),
  },
]

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
  {
    code: "lettered-signs-numbers-reeded",
    name: "Lettered-Signs-Numbers (reeded)",
    createdAt: new Date("2026-01-02T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
  },
]

export const seededEngravers: SeededEngraver[] = [
  {
    code: "georgios-stamatopoulos",
    name: "Georgios Stamatópoulos",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  },
  {
    code: "pertti-makinen",
    name: "Pertti Mäkinen",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  },
  {
    code: "luc-luycx",
    name: "Luc Luycx",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  },
]

export const seededIssuers: SeededIssuer[] = [
  {
    code: "argentina",
    name: "Argentina",
    isoCode: "AR",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  },
  {
    code: "buenos-aires",
    name: "Buenos Aires",
    isoCode: "AR",
    parentCode: "argentina",
    createdAt: new Date("2026-01-02T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
  },
  {
    code: "united-states",
    name: "United States of America",
    isoCode: "US",
    createdAt: new Date("2026-01-03T00:00:00.000Z"),
    updatedAt: new Date("2026-01-03T00:00:00.000Z"),
  },
  {
    code: "spain",
    name: "Spain",
    isoCode: "ES",
    createdAt: new Date("2026-01-04T00:00:00.000Z"),
    updatedAt: new Date("2026-01-04T00:00:00.000Z"),
  },
  {
    code: "finland",
    name: "Finland",
    isoCode: "FI",
    createdAt: new Date("2026-01-04T00:00:00.000Z"),
    updatedAt: new Date("2026-01-04T00:00:00.000Z"),
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
  {
    code: "mint-of-finland-ltd",
    name: "Mint of Finland Ltd. (Rahapaja Oy), Vantaa, Finland",
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
  {
    code: "raised-not-decorated-both-sides",
    name: "Raised. Not decorated. Both sides",
    createdAt: new Date("2026-01-03T00:00:00.000Z"),
    updatedAt: new Date("2026-01-03T00:00:00.000Z"),
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
  {
    name: "Republic",
    code: "republic",
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
  {
    code: "circular",
    name: "Circular",
    createdAt: new Date("2026-01-02T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
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
  {
    code: "leaves",
    name: "Leaves",
    createdAt: new Date("2026-01-07T00:00:00.000Z"),
    updatedAt: new Date("2026-01-07T00:00:00.000Z"),
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
  {
    coinTitle: "2 Euros (Enlargement of the European Union)",
    mintCode: "mint-of-finland-ltd",
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
  {
    coinTitle: "2 Euros (Enlargement of the European Union)",
    catalogueCode: "CA",
    number: "FI-00001",
    createdAt: new Date("2026-01-11T00:00:00.000Z"),
    updatedAt: new Date("2026-01-11T00:00:00.000Z"),
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
  {
    coinTitle: "2 Euros (Enlargement of the European Union)",
    rulerCode: "republic",
    rulerOrder: 1,
  },
]

export const seededCoinSurfaceEngravers: SeededCoinSurfaceEngraver[] = [
  {
    coinTitle: "Spain 2 Euro",
    coinSurfaceKind: "reverse",
    engraverCode: "georgios-stamatopoulos",
  },
  {
    coinTitle: "2 Euros (Enlargement of the European Union)",
    coinSurfaceKind: "obverse",
    engraverCode: "pertti-makinen",
  },
  {
    coinTitle: "2 Euros (Enlargement of the European Union)",
    coinSurfaceKind: "reverse",
    engraverCode: "luc-luycx",
  },
]

export const seededCoinSurfaces: SeededCoinSurface[] = [
  {
    coinTitle: "Spain 2 Euro",
    kind: "obverse",
    description: "Portrait of Felipe VI facing left.",
    lettering: "FELIPE VI REY DE ESPANA",
    thumbnailUrl: "https://example.com/coins/spain-2-euro/obverse-thumbnail",
    imageUrl: "https://example.com/coins/spain-2-euro/obverse-image",
  },
  {
    coinTitle: "Spain 2 Euro",
    kind: "reverse",
    description: "Map of Europe with denomination.",
    lettering: "2 EURO",
    thumbnailUrl: "https://example.com/coins/spain-2-euro/reverse-thumbnail",
    imageUrl: "https://example.com/coins/spain-2-euro/reverse-image",
  },
  {
    coinTitle: "Spain 2 Euro",
    kind: "edge-surface",
    description: "Finely reeded with incuse lettering.",
    lettering: "2 **",
    thumbnailUrl:
      "https://example.com/coins/spain-2-euro/edge-surface-thumbnail",
    imageUrl: "https://example.com/coins/spain-2-euro/edge-surface-image",
  },
  {
    coinTitle: "2 Euros (Enlargement of the European Union)",
    kind: "obverse",
    description:
      'A stylised pillar from which the sprouts grow upwards with the sprouts representing the enlargement of the European Union and the pillar representing the foundation for growth with the letters "EU" to the left of the pillar, and the date at the top in the outer ring along with the twelve stars of Europe',
    lettering: "2004 EU M M",
    thumbnailUrl: "https://example.com/coins/spain-2-euro/obverse-thumbnail",
    imageUrl: "https://example.com/coins/spain-2-euro/obverse-image",
  },
  {
    coinTitle: "2 Euros (Enlargement of the European Union)",
    kind: "reverse",
    description:
      "A map, next to the face value, shows the European continent without borders",
    lettering: "2 EURO LL",
    thumbnailUrl: "https://example.com/coins/spain-2-euro/obverse-thumbnail",
    imageUrl: "https://example.com/coins/spain-2-euro/obverse-image",
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
  {
    coinTitle: "2 Euros (Enlargement of the European Union)",
    themeCode: "map",
  },
  {
    coinTitle: "2 Euros (Enlargement of the European Union)",
    themeCode: "leaves",
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
    faceValueNumericValue: 2,
    faceValueText: "2 Euros",
    issuerCode: "spain",
    isDemonetized: false,
    mintage: 50000000,
    orientationCode: "medal-alignment",
    techniqueCode: "milled",
    shapeCode: "round",
    rimCode: "raised-both-sides",
    weight: 8.5,
    diameter: 25.75,
    thickness: 2.2,
    minYear: 2002,
    maxYear: 2026,
    createdAt: new Date("2026-01-11T00:00:00.000Z"),
    updatedAt: new Date("2026-01-11T00:00:00.000Z"),
  },
  {
    comments: "Fifth Enlargement of the European Union",
    compositionCode: "bimetallic",
    currencyCode: "euro",
    diameter: 25.75,
    distributionCode: "circulating-commemorative",
    edgeCode: "lettered-signs-numbers-reeded",
    faceValueNumericValue: 2,
    faceValueText: "2 Euros",
    isDemonetized: false,
    issuerCode: "finland",
    maxYear: 2004,
    minYear: 2004,
    mintage: 1000000,
    orientationCode: "medal-alignment",
    rimCode: "raised-not-decorated-both-sides",
    shapeCode: "circular",
    techniqueCode: "milled",
    thickness: 2.2,
    title: "2 Euros (Enlargement of the European Union)",
    weight: 8.5,
    createdAt: new Date("1987-08-24T00:00:00.000Z"),
    updatedAt: new Date("1987-08-24T00:00:00.000Z"),
  },
]
