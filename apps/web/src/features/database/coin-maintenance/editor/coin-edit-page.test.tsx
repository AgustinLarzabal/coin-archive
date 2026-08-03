import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import type { CoinMaintenanceRecord } from "@coin-archive/db"
import { CoinEditRouteComponent } from "./coin-edit-page"

vi.mock("@/components/access-denied", () => ({
  AccessDenied: () => "Access denied",
}))

vi.mock("./coin-form", () => ({
  CoinForm: () => "Coin form",
}))

const coin: CoinMaintenanceRecord & { etag: string } = {
  id: "coin-1",
  title: "Spanish Test Coin",
  comments: "Public note",
  compositionDescription: "Outer ring: nickel-brass; core: copper-nickel.",
  compositionId: "composition-1",
  currencyId: "currency-1",
  diameter: 24,
  distributionId: "distribution-1",
  edgeId: null,
  faceValueNumericValue: 1,
  faceValueText: "1 Euro",
  isDemonetized: null,
  issuerId: "issuer-1",
  maxYear: 2001,
  mintIds: ["mint-1"],
  minYear: 1999,
  mintage: 1000,
  orientationId: null,
  rimId: null,
  rulerIds: ["ruler-1"],
  shapeId: null,
  techniqueId: null,
  themeIds: ["theme-1"],
  thickness: 1.9,
  weight: 7.5,
  references: [],
  surfaces: {
    obverse: null,
    reverse: null,
    edge: null,
  },
  version: 1,
  etag: '"coin-version-1"',
  createdAt: new Date("2026-07-05T00:00:00.000Z"),
  updatedAt: new Date("2026-07-05T00:00:00.000Z"),
}

const options = {
  catalogues: [],
  issuers: [
    {
      id: "issuer-1",
      code: "spain",
      isoCode: "ES",
      name: "Spain",
    },
  ],
  rulers: [
    {
      id: "ruler-1",
      code: "charles-iii",
      name: "Charles III",
      group: null,
    },
  ],
  distributions: [
    {
      id: "distribution-1",
      code: "standard-circulation",
      name: "Standard circulation",
    },
  ],
  compositions: [
    {
      id: "composition-1",
      code: "silver-900",
      name: "Silver .900",
      description: null,
      createdAt: new Date("2026-07-05T00:00:00.000Z"),
      updatedAt: new Date("2026-07-05T00:00:00.000Z"),
    },
  ],
  currencies: [
    {
      id: "currency-1",
      code: "euro",
      name: "Euro",
      fullName: "Euro",
      createdAt: new Date("2026-07-05T00:00:00.000Z"),
      updatedAt: new Date("2026-07-05T00:00:00.000Z"),
    },
  ],
  engravers: [],
  mints: [],
  orientations: [],
  shapes: [],
  techniques: [],
  edges: [],
  rims: [],
  themes: [],
}

const deleteSummary = {
  title: coin.title,
  rulerAttributions: 1,
  mintAttributions: 1,
  themeAttributions: 1,
  catalogueReferences: 0,
  coinSurfaces: 0,
  engraverAttributions: 0,
}

describe("CoinEditRouteComponent", () => {
  it("renders the edit page with the public Coin link", () => {
    const markup = renderToStaticMarkup(
      <CoinEditRouteComponent
        loaderData={{
          isAllowed: true,
          coin,
          deleteSummary,
          options,
        }}
      />
    )

    expect(markup).toContain("Edit Coin")
    expect(markup).toContain("Coin form")
    expect(markup).toContain('href="/coins/coin-1"')
    expect(markup).toContain("Delete Coin")
    expect(markup).toContain("Ruler Attributions:")
    expect(markup).toContain("Mint Attributions:")
    expect(markup).toContain("Theme Attributions:")
    expect(markup).toContain("Shared lookup records remain untouched.")
    expect(markup).toContain("Spanish Test Coin")
  })

  it("renders a clear missing-Coin message when the edit loader cannot find the Coin", () => {
    const markup = renderToStaticMarkup(
      <CoinEditRouteComponent
        loaderData={{
          isAllowed: true,
          coin: null,
          deleteSummary: null,
          options,
        }}
      />
    )

    expect(markup).toContain("Coin no longer exists.")
  })
})
