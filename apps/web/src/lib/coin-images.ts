type SurfaceMedia = {
  imageUrl: string | null
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
  return surface?.imageUrl ?? PLACEHOLDER_COIN_IMAGE_URL
}

export function getCoinPreviewImageUrl(surfaces: CoinSurfaceSetLike): string {
  return (
    surfaces.obverse?.imageUrl ??
    surfaces.reverse?.imageUrl ??
    surfaces.edge?.imageUrl ??
    PLACEHOLDER_COIN_IMAGE_URL
  )
}
