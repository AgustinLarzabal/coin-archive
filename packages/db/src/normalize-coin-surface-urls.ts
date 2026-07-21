import { normalizeOptionalUrl } from "./normalize-optional-url"

type OptionalUrl = string | null | undefined

type CoinSurfaceUrls = {
  imageUrl?: OptionalUrl
}

export function normalizeCoinSurfaceUrls({
  imageUrl,
}: CoinSurfaceUrls) {
  return {
    imageUrl: normalizeOptionalUrl(imageUrl),
  }
}
