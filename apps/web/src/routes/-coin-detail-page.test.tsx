import type { CoinDetailRecord } from "@workspace/db"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { CoinDetailPage } from "./coins.$coinId"

const timestamp = new Date("2026-06-15T00:00:00.000Z")

const baseCoin: CoinDetailRecord = {
  id: "coin-1",
  title: "Detail Test Coin",
  issuer: {
    id: "issuer-1",
    code: "spain",
    isoCode: "ES",
    name: "Spain",
    createdAt: timestamp,
    updatedAt: timestamp,
    parent: null,
  },
}

function renderCoinDetailPageMarkup(coin: CoinDetailRecord | null = baseCoin) {
  return renderToStaticMarkup(<CoinDetailPage coin={coin} />)
}

describe("CoinDetailPage", () => {
  it("renders detail content from a CoinDetailRecord", () => {
    const markup = renderCoinDetailPageMarkup()

    expect(markup).toContain("Detail Test Coin")
    expect(markup).toContain("Spain")
  })
})
