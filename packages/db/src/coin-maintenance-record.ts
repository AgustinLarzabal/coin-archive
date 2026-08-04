export type CoinMaintenanceReference = {
  catalogueId: string
  number: string
}

export type CoinMaintenanceSurface = {
  description: string | null
  lettering: string | null
  imageUrl: string | null
}

export type CoinMaintenanceFaceSurface = CoinMaintenanceSurface & {
  engraverIds: string[]
}

export type CoinMaintenanceSurfaceSet = {
  obverse: CoinMaintenanceFaceSurface | null
  reverse: CoinMaintenanceFaceSurface | null
  edge: CoinMaintenanceSurface | null
}

export type CoinMaintenanceRecord = {
  id: string
  title: string
  comments: string | null
  compositionDescription: string | null
  compositionId: string
  currencyId: string
  diameter: string | null
  distributionId: string
  edgeId: string | null
  faceValueNumericValue: string
  faceValueText: string
  isDemonetized: boolean | null
  issuerId: string
  maxYear: number | null
  mintIds: string[]
  minYear: number | null
  mintage: number | null
  orientationId: string | null
  rimId: string | null
  rulerIds: string[]
  shapeId: string | null
  techniqueId: string | null
  themeIds: string[]
  thickness: string | null
  weight: string | null
  references: CoinMaintenanceReference[]
  surfaces: CoinMaintenanceSurfaceSet
  version: number
  createdAt: Date
  updatedAt: Date
}
