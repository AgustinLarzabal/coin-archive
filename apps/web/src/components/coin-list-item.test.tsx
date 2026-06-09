import type { CoinRecord } from "@workspace/db"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { CoinListItem } from "./coin-list-item"

const timestamp = new Date("2026-06-08T00:00:00.000Z")

const baseCoin: CoinRecord = {
  id: "coin-1",
  title: "Theme Test Coin",
  createdAt: timestamp,
  updatedAt: timestamp,
  issueYearRange: null,
  faceValue: {
    text: "1 Euro",
    numericValue: 1,
    currency: {
      id: "currency-1",
      code: "euro",
      name: "Euro",
      fullName: "Euro (2002-date)",
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  },
  orientation: null,
  shape: null,
  obverse: null,
  reverse: null,
  measurements: {
    weight: null,
    diameter: null,
    thickness: null,
  },
  composition: {
    id: "composition-1",
    code: "silver-900",
    name: "Silver (.900)",
    description: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  distribution: {
    id: "distribution-1",
    code: "standard-circulation",
    name: "Standard circulation",
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  mintage: null,
  rim: null,
  issuer: {
    id: "issuer-1",
    code: "spain",
    name: "Spain",
    createdAt: timestamp,
    updatedAt: timestamp,
    parent: null,
  },
  mints: [],
  themes: [],
  rulers: [],
  references: [],
}

function renderCoinListItemMarkup(coin: CoinRecord = baseCoin) {
  return renderToStaticMarkup(
    <CoinListItem
      coin={coin}
      issueYearRangeLabel="Issue year unknown"
      measurementSummary={null}
      mintNames={null}
    />
  )
}

describe("CoinListItem", () => {
  it("renders grouped Mintage when known", () => {
    const markup = renderCoinListItemMarkup({
      ...baseCoin,
      mintage: 1234567,
    })

    expect(markup).toContain("Mintage: 1,234,567")
  })

  it("omits Mintage when unknown", () => {
    const markup = renderCoinListItemMarkup()

    expect(markup).not.toContain("Mintage:")
  })

  it("renders a Themes row when a coin has one or more themes", () => {
    const markup = renderCoinListItemMarkup({
      ...baseCoin,
      themes: [
        {
          id: "theme-1",
          code: "building",
          name: "Building",
          createdAt: timestamp,
          updatedAt: timestamp,
        },
        {
          id: "theme-2",
          code: "map",
          name: "Map",
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ],
    })

    expect(markup).toContain("Themes: Building, Map")
  })

  it("omits the Themes row when a coin has no themes", () => {
    const markup = renderCoinListItemMarkup({
      ...baseCoin,
      themes: [],
    })

    expect(markup).not.toContain("Themes:")
  })

  it("renders an Orientation row when a coin has a known Orientation", () => {
    const markup = renderToStaticMarkup(
      <CoinListItem
        coin={{
          ...baseCoin,
          orientation: {
            id: "orientation-1",
            code: "coin-alignment",
            name: "Coin alignment",
            createdAt: timestamp,
            updatedAt: timestamp,
          },
        }}
        issueYearRangeLabel="Issue year unknown"
        measurementSummary={null}
        mintNames={null}
      />
    )

    expect(markup).toContain("Orientation: Coin alignment")
    expect(markup).not.toContain("coin-alignment")
  })

  it("omits the Orientation row when a coin has no Orientation", () => {
    const markup = renderToStaticMarkup(
      <CoinListItem
        coin={baseCoin}
        issueYearRangeLabel="Issue year unknown"
        measurementSummary={null}
        mintNames={null}
      />
    )

    expect(markup).not.toContain("Orientation:")
  })

  it("renders Shape, Orientation, Rim, and Mintage in compact order using display names only", () => {
    const markup = renderCoinListItemMarkup({
      ...baseCoin,
      shape: {
        id: "shape-1",
        code: "round",
        name: "Round",
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      orientation: {
        id: "orientation-1",
        code: "coin-alignment",
        name: "Coin alignment",
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      rim: {
        id: "rim-1",
        code: "raised-both-sides",
        name: "Raised, both sides",
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      mintage: 1234567,
    })

    expect(markup).toContain("Shape: Round")
    expect(markup).toContain("Orientation: Coin alignment")
    expect(markup).toContain("Rim: Raised, both sides")
    expect(markup).toContain("Mintage: 1,234,567")
    expect(markup).not.toContain("raised-both-sides")

    expect(markup.indexOf("Shape: Round")).toBeLessThan(
      markup.indexOf("Orientation: Coin alignment")
    )
    expect(markup.indexOf("Orientation: Coin alignment")).toBeLessThan(
      markup.indexOf("Rim: Raised, both sides")
    )
    expect(markup.indexOf("Rim: Raised, both sides")).toBeLessThan(
      markup.indexOf("Mintage: 1,234,567")
    )
  })
})
