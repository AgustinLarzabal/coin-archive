import type { CoinDetailRecord } from "@workspace/db"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { CoinDetailPage } from "./coins.$coinId"

const baseCoin: CoinDetailRecord = {
  id: "coin-1",
  title: "Detail Test Coin",
  comments: null,
  issuer: {
    code: "spain",
    isoCode: "ES",
    name: "Spain",
    parent: null,
  },
  surfaces: {
    obverse: {
      description: "Portrait facing left.",
      lettering: "DETAIL TEST",
      thumbnailUrl: "https://example.com/coins/detail-test/obverse-thumb",
      imageUrl: "https://example.com/coins/detail-test/obverse-image",
      engravers: [],
    },
    reverse: {
      description: "Denomination and wreath.",
      lettering: "1 TEST UNIT",
      thumbnailUrl: "https://example.com/coins/detail-test/reverse-thumb",
      imageUrl: "https://example.com/coins/detail-test/reverse-image",
      engravers: [],
    },
    edge: null,
  },
}

function renderCoinDetailPageMarkup(coin: CoinDetailRecord = baseCoin) {
  return renderToStaticMarkup(<CoinDetailPage coin={coin} />)
}

describe("CoinDetailPage", () => {
  it("renders detail content from a CoinDetailRecord", () => {
    const markup = renderCoinDetailPageMarkup()

    expect(markup).toContain("Detail Test Coin")
    expect(markup).toContain("Spain")
    expect(markup).toContain("https://example.com/coins/detail-test/obverse-image")
    expect(markup).toContain("https://example.com/coins/detail-test/reverse-image")
    expect(markup).not.toContain("/finland-2-euro-2004-obverse.jpg")
  })
})
