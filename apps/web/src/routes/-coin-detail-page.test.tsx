import type { ComponentPropsWithoutRef } from "react"
import type { CoinDetailRecord } from "@workspace/db"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { CoinDetailPage } from "./coins.$coinId"

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-router")>()

  return {
    ...actual,
    Link: ({
      children,
      search,
      to = "",
      ...props
    }: ComponentPropsWithoutRef<"a"> & {
      search?: Record<string, string | undefined>
      to?: string
    }) => {
      const params = new URLSearchParams()

      for (const [key, value] of Object.entries(search ?? {})) {
        if (value !== undefined) {
          params.set(key, value)
        }
      }

      const query = params.toString()
      const href = query === "" ? to : `${to}?${query}`

      return (
        <a href={href} {...props}>
          {children}
        </a>
      )
    },
  }
})

const baseCoin: CoinDetailRecord = {
  id: "coin-1",
  title: "Detail Test Coin",
  comments: null,
  composition: {
    code: "copper-nickel",
    name: "Copper-nickel",
    description: null,
  },
  diameter: null,
  distribution: {
    code: "standard-circulation",
    name: "Standard circulation",
  },
  edge: null,
  isDemonetized: null,
  issuer: {
    code: "spain",
    isoCode: "ES",
    name: "Spain",
    parent: null,
  },
  maxYear: 2004,
  mintage: null,
  minYear: 1999,
  orientation: null,
  references: [],
  rim: null,
  rulers: [],
  shape: null,
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
  technique: null,
  themes: [],
  thickness: null,
  weight: null,
}

function renderCoinDetailPageMarkup(coin: CoinDetailRecord = baseCoin) {
  return renderToStaticMarkup(<CoinDetailPage coin={coin} />)
}

describe("CoinDetailPage", () => {
  it("renders detail content from a CoinDetailRecord", () => {
    const markup = renderCoinDetailPageMarkup()

    expect(markup).toContain("Detail Test Coin")
    expect(markup).toContain("Spain")
    expect(markup).toContain('href="/?issuer=spain"')
    expect(markup).toContain('href="/?distribution=standard-circulation"')
    expect(markup).toContain("https://example.com/coins/detail-test/obverse-image")
    expect(markup).toContain("https://example.com/coins/detail-test/reverse-image")
    expect(markup).not.toContain("/finland-2-euro-2004-obverse.jpg")
  })

  it("renders reference separators only between reference items", () => {
    const markup = renderCoinDetailPageMarkup({
      ...baseCoin,
      references: [
        {
          catalogue: {
            code: "KM",
            title: "Krause Mishler",
          },
          number: "1",
        },
        {
          catalogue: {
            code: "RIC",
            title: "Roman Imperial Coinage",
          },
          number: "2",
        },
      ],
    })

    expect(markup).toContain("KM: 1")
    expect(markup).toContain("RIC: 2")
    expect(markup.match(/data-orientation=\"vertical\"/g)).toHaveLength(1)
  })

  it("renders a singular year label and one badge for single-year coins", () => {
    const markup = renderCoinDetailPageMarkup({
      ...baseCoin,
      minYear: 1900,
      maxYear: 1900,
    })

    expect(markup).toContain("Year:")
    expect(markup).not.toContain("Years:")
    expect(markup).toContain(">1900</")
    expect(markup).not.toContain(">-<")
  })

  it("formats mintage with grouped digits", () => {
    const markup = renderCoinDetailPageMarkup({
      ...baseCoin,
      mintage: 1250000,
    })

    expect(markup).toContain("1,250,000")
  })
})
