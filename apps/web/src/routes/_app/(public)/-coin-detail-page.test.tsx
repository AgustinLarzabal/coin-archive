import type { ComponentPropsWithoutRef } from "react"
import type { CoinDetail } from "@coin-archive/api"
import type * as TanstackReactRouter from "@tanstack/react-router"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { RULER_FILTER_LABEL } from "../../../lib/ruler-filter"
import { CoinDetailPage } from "./coins.$coinId"

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof TanstackReactRouter>()

  return {
    ...actual,
    Link: ({
      children,
      params,
      search,
      to = "",
      ...props
    }: ComponentPropsWithoutRef<"a"> & {
      search?: Record<string, string | undefined>
      params?: Record<string, string>
      to?: string
    }) => {
      const searchParams = new URLSearchParams()

      for (const [key, value] of Object.entries(search ?? {})) {
        if (value !== undefined) {
          searchParams.set(key, value)
        }
      }

      const query = searchParams.toString()
      const path = Object.entries(params ?? {}).reduce(
        (currentPath, [key, value]) => currentPath.replace(`$${key}`, value),
        to
      )
      const href = query === "" ? path : `${path}?${query}`

      return (
        <a href={href} {...props}>
          {children}
        </a>
      )
    },
  }
})

const baseCoin: CoinDetail = {
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
    numericValue: "2",
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
      imageUrl: "https://example.com/coins/detail-test/obverse-image",
      engravers: [],
    },
    reverse: {
      description: "Denomination and wreath.",
      lettering: "1 TEST UNIT",
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
  coin: CoinDetail = baseCoin,
  backHomeSearch?: {
    distribution?: string
    engraver?: string
    issuer?: string
  },
  canMaintainCoins = false
) {
  return renderToStaticMarkup(
    <CoinDetailPage
      coin={coin}
      backHomeSearch={backHomeSearch}
      canMaintainCoins={canMaintainCoins}
    />
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
    expect(markup).toContain(
      "https://example.com/coins/detail-test/obverse-image"
    )
    expect(markup).toContain(
      "https://example.com/coins/detail-test/reverse-image"
    )
    expect(markup).not.toContain("/finland-2-euro-2004-obverse.jpg")
  })

  it("shows an edit link only for collectors with database maintenance access", () => {
    const authorizedMarkup = renderCoinDetailPageMarkup(
      baseCoin,
      undefined,
      true
    )
    const unauthorizedMarkup = renderCoinDetailPageMarkup(
      baseCoin,
      undefined,
      false
    )

    expect(authorizedMarkup).toContain("Edit coin")
    expect(authorizedMarkup).toContain('href="/database/coins/coin-1/edit"')
    expect(unauthorizedMarkup).not.toContain("Edit coin")
  })

  it("falls back to the placeholder image when a surface has no images", () => {
    const markup = renderCoinDetailPageMarkup({
      ...baseCoin,
      surfaces: {
        obverse: {
          ...baseCoin.surfaces.obverse!,
          imageUrl: null,
        },
        reverse: {
          ...baseCoin.surfaces.reverse!,
          imageUrl: null,
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
      mintage: "1250000",
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
        { code: "seville", name: "Seville Mint" },
      ],
    })

    expect(singularMarkup).toContain(">Mint</span>")
    expect(pluralMarkup).toContain(">Mints</span>")
  })

  it("renders one ruler link per ruler with issuer-preserving filter descriptions", () => {
    const markup = renderCoinDetailPageMarkup({
      ...baseCoin,
      rulers: [
        { code: "juan-carlos-i", name: "Juan Carlos I" },
        { code: "felipe-vi", name: "Felipe VI" },
      ],
    })

    expect(markup).toContain(RULER_FILTER_LABEL)
    expect(markup).toContain('href="/?issuer=spain&amp;ruler=juan-carlos-i"')
    expect(markup).toContain('href="/?issuer=spain&amp;ruler=felipe-vi"')
  })

  it("shows the demonetized badge when a coin is demonetized", () => {
    const markup = renderCoinDetailPageMarkup({
      ...baseCoin,
      isDemonetized: true,
    })

    expect(markup).toContain("Demonetized")
  })
})
