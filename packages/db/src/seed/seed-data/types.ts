import type {
  CoinSurfaceKind,
  EngravableCoinSurfaceKind,
} from "../../schema/coin-surface"

export type SeededCatalogue = {
  code: string
  title: string
  createdAt: Date
  updatedAt: Date
}

export type SeededComposition = {
  code: string
  name: string
  createdAt: Date
  updatedAt: Date
}

export type SeededCurrency = {
  code: string
  name: string
  fullName: string
  createdAt: Date
  updatedAt: Date
}

export type SeededDistribution = {
  code: string
  name: string
  createdAt: Date
  updatedAt: Date
}

export type SeededEdge = {
  code: string
  name: string
  createdAt: Date
  updatedAt: Date
}

export type SeededEngraver = {
  code: string
  name: string
  createdAt: Date
  updatedAt: Date
}

export type SeededIssuer = {
  code: string
  name: string
  isoCode: string
  parentCode?: string
  createdAt: Date
  updatedAt: Date
}

export type SeededMint = {
  code: string
  name: string
  createdAt: Date
  updatedAt: Date
}

export type SeededOrientation = {
  code: string
  name: string
  createdAt: Date
  updatedAt: Date
}

export type SeededRim = {
  code: string
  name: string
  createdAt: Date
  updatedAt: Date
}

export type SeededRulerGroup = {
  name: string
  code: string
  createdAt: Date
  updatedAt: Date
}

export type SeededRuler = {
  name: string
  code: string
  rulerGroupCode?: string
  createdAt: Date
  updatedAt: Date
}

export type SeededShape = {
  code: string
  name: string
  createdAt: Date
  updatedAt: Date
}

export type SeededTechnique = {
  code: string
  name: string
  createdAt: Date
  updatedAt: Date
}

export type SeededTheme = {
  code: string
  name: string
  createdAt: Date
  updatedAt: Date
}

export type SeededCoinMint = {
  coinTitle: string
  mintCode: string
}

export type SeededCoinReference = {
  coinTitle: string
  catalogueCode: string
  number: string
  createdAt: Date
  updatedAt: Date
}

export type SeededCoinRuler = {
  coinTitle: string
  rulerCode: string
  rulerOrder: number
}

export type SeededCoinSurfaceEngraver = {
  coinTitle: string
  coinSurfaceKind: EngravableCoinSurfaceKind
  engraverCode: string
}

export type SeededCoinSurfaceDetails = {
  kind: CoinSurfaceKind
  description?: string | null
  lettering?: string | null
  imageUrl?: string | null
}

export type SeededCoinSurface = SeededCoinSurfaceDetails & {
  coinTitle: string
}

export type SeededCoinTheme = {
  coinTitle: string
  themeCode: string
}

export type SeededCoin = {
  comments?: string | null
  compositionDescription?: string | null
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
