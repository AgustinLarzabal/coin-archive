import type { ComponentPropsWithoutRef } from "react"
import type { CoinListRecord } from "@workspace/db"
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
})
