import type { CoinDetailRecord } from "@workspace/db"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { CoinDetailPage } from "./coins.$coinId"

const timestamp = new Date("2026-06-15T00:00:00.000Z")

const baseCoin: CoinDetailRecord = {
  id: "coin-1",
  title: "Surface Detail Test Coin",
  issuer: {
    id: "issuer-1",
    code: "spain",
    isoCode: "ES",
    name: "Spain",
    createdAt: timestamp,
    updatedAt: timestamp,
    parent: null,
  },
  edge: {
    id: "edge-1",
    code: "lettered",
    name: "Lettered",
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  surfaces: {
    obverse: {
      description: "Portrait right.",
      lettering: "FELIPE VI",
      thumbnailUrl: "https://example.com/coins/coin-1/obverse-thumb",
      imageUrl: "https://example.com/coins/coin-1/obverse-image",
      engravers: [],
    },
    reverse: {
      description: null,
      lettering: null,
      thumbnailUrl: null,
      imageUrl: "https://example.com/coins/coin-1/reverse-image",
      engravers: [],
    },
    edge: {
      description: null,
      lettering: "2 **",
      thumbnailUrl: "https://example.com/coins/coin-1/edge-thumb",
      imageUrl: null,
    },
  },
}

function renderCoinDetailPageMarkup(coin: CoinDetailRecord | null = baseCoin) {
  return renderToStaticMarkup(<CoinDetailPage coin={coin} />)
}

describe("CoinDetailPage", () => {
  it("renders detail content from a CoinDetailRecord without rendering surface imagery", () => {
    const markup = renderCoinDetailPageMarkup()

    expect(markup).toContain("Surface Detail Test Coin")
    expect(markup).toContain("Spain")
    expect(markup).not.toContain("https://example.com/coins/coin-1/obverse-thumb")
    expect(markup).not.toContain("https://example.com/coins/coin-1/reverse-image")
    expect(markup).not.toContain("https://example.com/coins/coin-1/edge-thumb")
  })
})
