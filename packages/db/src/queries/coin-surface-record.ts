export type CoinFaceEngraverRecord = {
  code: string
  name: string
}

export type CoinSurfaceRecord = {
  description: string | null
  lettering: string | null
  thumbnailUrl: string | null
  imageUrl: string | null
}

export type CoinFaceSurfaceRecord = CoinSurfaceRecord & {
  engravers: CoinFaceEngraverRecord[]
}

export type CoinSurfaceSetRecord = {
  obverse: CoinFaceSurfaceRecord | null
  reverse: CoinFaceSurfaceRecord | null
  edge: CoinSurfaceRecord | null
}
