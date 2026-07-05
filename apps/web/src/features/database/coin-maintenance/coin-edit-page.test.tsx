import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import {
  CoinEditRouteComponent,
  loadCoinEditPageData,
} from "./coin-edit-page"

vi.mock("@/components/access-denied", () => ({
  AccessDenied: () => "Access denied",
}))

vi.mock("./coin-form", () => ({
  CoinForm: () => "Coin form",
}))

const coin = {
  id: "coin-1",
  title: "Spanish Test Coin",
  comments: "Public note",
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
  minYear: 1999,
  mintage: 1000,
  orientationId: null,
  rimId: null,
  rulerId: "ruler-1",
  shapeId: null,
  techniqueId: null,
  thickness: 1.9,
  weight: 7.5,
} as const

const options = {
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
  orientations: [],
  shapes: [],
  techniques: [],
  edges: [],
  rims: [],
}

describe("loadCoinEditPageData", () => {
  it("rejects signed-in Collectors without editor access", async () => {
    await expect(
      loadCoinEditPageData(
        { role: "collector" },
        {
          coinId: coin.id,
        },
        {
          getCoinMaintenanceRecord: vi.fn(),
          getIssuers: vi.fn(),
          getRulers: vi.fn(),
          getDistributions: vi.fn(),
          getCompositions: vi.fn(),
          getCurrencies: vi.fn(),
          getOrientations: vi.fn(),
          getShapes: vi.fn(),
          getTechniques: vi.fn(),
          getEdges: vi.fn(),
          getRims: vi.fn(),
        }
      )
    ).resolves.toStrictEqual({
      status: "error",
    })
  })

  it("returns the current Coin and lookup options for Editors and Admins", async () => {
    const dependencies = {
      getCoinMaintenanceRecord: vi.fn().mockResolvedValue(coin),
      getIssuers: vi.fn().mockResolvedValue(options.issuers),
      getRulers: vi.fn().mockResolvedValue(options.rulers),
      getDistributions: vi.fn().mockResolvedValue(options.distributions),
      getCompositions: vi.fn().mockResolvedValue(options.compositions),
      getCurrencies: vi.fn().mockResolvedValue(options.currencies),
      getOrientations: vi.fn().mockResolvedValue(options.orientations),
      getShapes: vi.fn().mockResolvedValue(options.shapes),
      getTechniques: vi.fn().mockResolvedValue(options.techniques),
      getEdges: vi.fn().mockResolvedValue(options.edges),
      getRims: vi.fn().mockResolvedValue(options.rims),
    }

    await expect(
      loadCoinEditPageData({ role: "admin" }, { coinId: coin.id }, dependencies)
    ).resolves.toStrictEqual({
      status: "success",
      coin,
      options,
    })
  })
})

describe("CoinEditRouteComponent", () => {
  it("renders the edit page with the public Coin link", () => {
    const markup = renderToStaticMarkup(
      <CoinEditRouteComponent
        loaderData={{
          isAllowed: true,
          coin,
          options,
        }}
      />
    )

    expect(markup).toContain("Edit Coin")
    expect(markup).toContain("Coin form")
    expect(markup).toContain('href="/coins/coin-1"')
  })

  it("renders a clear missing-Coin message when the edit loader cannot find the Coin", () => {
    const markup = renderToStaticMarkup(
      <CoinEditRouteComponent
        loaderData={{
          isAllowed: true,
          coin: null,
          options,
        }}
      />
    )

    expect(markup).toContain("Coin no longer exists.")
  })
})
