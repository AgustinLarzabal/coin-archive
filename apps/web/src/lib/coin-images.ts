type SurfaceMedia = {
  imageUrl: string | null
  thumbnailUrl: string | null
}

type CoinSurfaceSetLike = {
  obverse?: SurfaceMedia | null
  reverse?: SurfaceMedia | null
  edge?: SurfaceMedia | null
}

export const PLACEHOLDER_COIN_IMAGE_URL = "/placeholder-coin.svg"

export function getSurfaceImageUrl(
  surface: SurfaceMedia | null | undefined
): string {
  return (
    surface?.imageUrl ?? surface?.thumbnailUrl ?? PLACEHOLDER_COIN_IMAGE_URL
  )
}

export function getCoinPreviewImageUrl(surfaces: CoinSurfaceSetLike): string {
  return (
    surfaces.obverse?.imageUrl ??
    surfaces.obverse?.thumbnailUrl ??
    surfaces.reverse?.imageUrl ??
    surfaces.reverse?.thumbnailUrl ??
    surfaces.edge?.imageUrl ??
    surfaces.edge?.thumbnailUrl ??
    PLACEHOLDER_COIN_IMAGE_URL
  )
}
