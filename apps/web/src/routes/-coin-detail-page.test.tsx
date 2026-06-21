import type { ComponentPropsWithoutRef } from "react"
import type { CoinDetailRecord } from "@workspace/db"
import type * as TanstackReactRouter from "@tanstack/react-router"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { CoinDetailPage } from "./coins.$coinId"

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof TanstackReactRouter>()

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
  faceValue: {
    text: "2 Euros",
    numericValue: 2,
    currency: {
      code: "euro",
      name: "Euro",
      fullName: "Euro",
    },
  },
  isDemonetized: null,
  issuer: {
    code: "spain",
    isoCode: "ES",
    name: "Spain",
    parent: null,
  },
  maxYear: 2004,
  mintage: null,
  mints: [],
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

function renderCoinDetailPageMarkup(
  coin: CoinDetailRecord = baseCoin,
  backHomeSearch?: {
    distribution?: string
    engraver?: string
    issuer?: string
  }
) {
  return renderToStaticMarkup(
    <CoinDetailPage coin={coin} backHomeSearch={backHomeSearch} />
  )
}

describe("CoinDetailPage", () => {
  it("renders detail content from a CoinDetailRecord", () => {
    const markup = renderCoinDetailPageMarkup(baseCoin, {
      distribution: "standard-circulation",
      issuer: "spain",
    })

    expect(markup).toContain("Detail Test Coin")
    expect(markup).toContain("Spain")
    expect(markup).toContain(
      'href="/?distribution=standard-circulation&amp;issuer=spain"'
    )
    expect(markup).toContain('href="/?issuer=spain"')
    expect(markup).toContain('href="/?distribution=standard-circulation"')
    expect(markup).toContain("https://example.com/coins/detail-test/obverse-image")
    expect(markup).toContain("https://example.com/coins/detail-test/reverse-image")
    expect(markup).not.toContain("/finland-2-euro-2004-obverse.jpg")
  })

  it("falls back to the placeholder image when a surface has no images", () => {
    const markup = renderCoinDetailPageMarkup({
      ...baseCoin,
      surfaces: {
        obverse: {
          ...baseCoin.surfaces.obverse!,
          imageUrl: null,
          thumbnailUrl: null,
        },
        reverse: {
          ...baseCoin.surfaces.reverse!,
          imageUrl: null,
          thumbnailUrl: null,
        },
        edge: null,
      },
    })

    expect(markup).toContain("/placeholder-coin.svg")
    expect(markup).toContain("Portrait facing left.")
    expect(markup).toContain("Denomination and wreath.")
  })

  it("renders the placeholder image when the coin has no surfaces", () => {
    const markup = renderCoinDetailPageMarkup({
      ...baseCoin,
      surfaces: {
        obverse: null,
        reverse: null,
        edge: null,
      },
    })

    expect(markup).toContain("/placeholder-coin.svg")
    expect(markup).toContain('alt="Detail Test Coin placeholder"')
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
    expect(markup.match(/data-orientation="vertical"/g)).toHaveLength(1)
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

  it("omits the year block when the issue year range is unknown", () => {
    const markup = renderCoinDetailPageMarkup({
      ...baseCoin,
      minYear: null,
      maxYear: null,
    })

    expect(markup).not.toContain("Year:")
    expect(markup).not.toContain("Years:")
    expect(markup).not.toContain(">null</")
  })

  it("formats mintage with grouped digits", () => {
    const markup = renderCoinDetailPageMarkup({
      ...baseCoin,
      mintage: 1250000,
    })

    expect(markup).toContain("1,250,000")
  })

  it("pluralizes the mint label when a coin has multiple mints", () => {
    const singularMarkup = renderCoinDetailPageMarkup({
      ...baseCoin,
      mints: [{ code: "madrid", name: "Madrid Mint" }],
    })
    const pluralMarkup = renderCoinDetailPageMarkup({
      ...baseCoin,
      mints: [
        { code: "madrid", name: "Madrid Mint" },
        { code: "barcelona", name: "Barcelona Mint" },
      ],
    })

    expect(singularMarkup).toContain("Mint")
    expect(singularMarkup).not.toContain("Mints")
    expect(pluralMarkup).toContain("Mints")
  })

  it("links rulers to the home issuer and ruler filters", () => {
    const markup = renderCoinDetailPageMarkup({
      ...baseCoin,
      rulers: [
        {
          code: "charles-iii",
          name: "Charles III",
        },
      ],
    })

    expect(markup).toContain("Ruling authority")
    expect(markup).toContain('href="/?issuer=spain&amp;ruler=charles-iii"')
    expect(markup).toContain(
      "Show homepage coins filtered by issuer Spain and ruling authority Charles III"
    )
  })

  it("links themes to the home theme filter", () => {
    const markup = renderCoinDetailPageMarkup({
      ...baseCoin,
      themes: [
        {
          code: "building",
          name: "Building",
        },
        {
          code: "map",
          name: "Map",
        },
      ],
    })

    expect(markup).toContain('href="/?theme=building"')
    expect(markup).toContain('href="/?theme=map"')
    expect(markup).toContain("Show homepage coins filtered by theme Building")
    expect(markup).toContain("Show homepage coins filtered by theme Map")
  })
})
