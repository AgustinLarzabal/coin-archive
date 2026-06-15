import { normalizeOptionalUrl } from "./normalize-optional-url"

type OptionalUrl = string | null | undefined

type CoinSurfaceUrls = {
  thumbnailUrl?: OptionalUrl
  imageUrl?: OptionalUrl
}

export function normalizeCoinSurfaceUrls({
  thumbnailUrl,
  imageUrl,
}: CoinSurfaceUrls) {
  return {
    thumbnailUrl: normalizeOptionalUrl(thumbnailUrl),
    imageUrl: normalizeOptionalUrl(imageUrl),
  }
}
