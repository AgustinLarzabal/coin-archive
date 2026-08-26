import type { ComponentPropsWithoutRef } from "react"
import type { CoinListRecord } from "@coin-archive/db"
import type * as TanstackReactRouter from "@tanstack/react-router"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { CoinCard } from "./coin-card"

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof TanstackReactRouter>()

  return {
    ...actual,
    Link: ({
      children,
      to = "",
      ...props
    }: ComponentPropsWithoutRef<"a"> & {
      to?: string
    }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
  }
})

const baseCoin: CoinListRecord = {
  id: "coin-1",
  title: "Preview Test Coin",
  minYear: 2005,
  maxYear: 2005,
  issuer: {
    code: "spain",
    isoCode: "ES",
    name: "Spain",
  },
  surfaces: {
    obverse: {
      description: "Portrait facing left.",
      lettering: "DETAIL TEST",
      imageUrl: "https://example.com/coins/preview-test/obverse-image",
      engravers: [],
    },
    reverse: null,
    edge: null,
  },
}

describe("CoinCard", () => {
  it("uses the first available coin image for the preview", () => {
    const markup = renderToStaticMarkup(<CoinCard coin={baseCoin} />)

    expect(markup).toContain("https://example.com/coins/preview-test/obverse-image")
    expect(markup).not.toContain("/placeholder-coin.svg")
  })

  it("falls back to the placeholder image when the coin has no images", () => {
    const markup = renderToStaticMarkup(
      <CoinCard
        coin={{
          ...baseCoin,
          surfaces: {
            obverse: {
              ...baseCoin.surfaces.obverse!,
              imageUrl: null,
            },
            reverse: null,
            edge: null,
          },
        }}
      />
    )

    expect(markup).toContain("/placeholder-coin.svg")
  })

  it("renders a known issue year range", () => {
    const markup = renderToStaticMarkup(
      <CoinCard coin={{ ...baseCoin, minYear: 1999, maxYear: 2004 }} />
    )

    expect(markup).toContain("1999")
    expect(markup).toContain("2004")
  })

  it("omits the issue year when its range is unknown", () => {
    const markup = renderToStaticMarkup(
      <CoinCard coin={{ ...baseCoin, minYear: null, maxYear: null }} />
    )

    expect(markup).not.toContain("2005")
  })
})
