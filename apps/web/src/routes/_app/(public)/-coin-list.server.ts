import { getPublicApiClient } from "../../../lib/public-api.server"
import type { CoinListLoaderDeps } from "../../../lib/coin-search"

export async function getPublicCoinList(data: CoinListLoaderDeps) {
  const response = await getPublicApiClient().coins.browse({
    cursor: data.cursor,
    distribution: data.distributionCode,
    engraver: data.engraverCode,
    issuer: data.issuerCode,
    q: data.q,
    ruler: data.rulerCode,
    theme: data.themeCode,
  })
  return {
    coins: response.data.map((coin) => ({
      id: coin.id,
      title: coin.title,
      minYear: coin.minYear,
      maxYear: coin.maxYear,
      issuer: coin.issuer,
      surfaces: {
        obverse:
          coin.surfaceImages.obverse === null
            ? null
            : {
                description: null,
                lettering: null,
                imageUrl: coin.surfaceImages.obverse,
                engravers: [],
              },
        reverse:
          coin.surfaceImages.reverse === null
            ? null
            : {
                description: null,
                lettering: null,
                imageUrl: coin.surfaceImages.reverse,
                engravers: [],
              },
        edge:
          coin.surfaceImages.edge === null
            ? null
            : {
                description: null,
                lettering: null,
                imageUrl: coin.surfaceImages.edge,
              },
      },
    })),
    nextCursor: response.nextCursor,
  }
}
