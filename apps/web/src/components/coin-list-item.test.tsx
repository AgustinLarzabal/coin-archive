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

describe("CoinListItem", () => {
  it("renders a Themes row when a coin has one or more themes", () => {
    const markup = renderToStaticMarkup(
      <CoinListItem
        coin={{
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
        }}
        issueYearRangeLabel="Issue year unknown"
        measurementSummary={null}
        mintNames={null}
      />
    )

    expect(markup).toContain("Themes: Building, Map")
  })

  it("omits the Themes row when a coin has no themes", () => {
    const markup = renderToStaticMarkup(
      <CoinListItem
        coin={{
          ...baseCoin,
          themes: [],
        }}
        issueYearRangeLabel="Issue year unknown"
        measurementSummary={null}
        mintNames={null}
      />
    )

    expect(markup).not.toContain("Themes:")
  })
})
