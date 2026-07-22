import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import {
  CoinCreateRouteComponent,
  loadCoinCreatePageData,
} from "./coin-create-page"

vi.mock("@/components/access-denied", () => ({
  AccessDenied: () => "Access denied",
}))

vi.mock("./coin-form", () => ({
  CoinForm: () => "Coin form",
}))

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

describe("loadCoinCreatePageData", () => {
  it("rejects signed-in Collectors without editor access", async () => {
    await expect(
      loadCoinCreatePageData(
        { role: "collector" },
        {
          getCatalogues: vi.fn(),
          getIssuers: vi.fn(),
          getRulers: vi.fn(),
          getDistributions: vi.fn(),
          getCompositions: vi.fn(),
          getCurrencies: vi.fn(),
          getEngravers: vi.fn(),
          getMints: vi.fn(),
          getOrientations: vi.fn(),
          getShapes: vi.fn(),
          getTechniques: vi.fn(),
          getEdges: vi.fn(),
          getRims: vi.fn(),
          getThemes: vi.fn(),
        }
      )
    ).resolves.toStrictEqual({
      status: "error",
    })
  })

  it("returns the eager lookup options for Editors and Admins", async () => {
    const dependencies = {
      getCatalogues: vi.fn().mockResolvedValue(options.catalogues),
      getIssuers: vi.fn().mockResolvedValue(options.issuers),
      getRulers: vi.fn().mockResolvedValue(options.rulers),
      getDistributions: vi.fn().mockResolvedValue(options.distributions),
      getCompositions: vi.fn().mockResolvedValue(options.compositions),
      getCurrencies: vi.fn().mockResolvedValue(options.currencies),
      getEngravers: vi.fn().mockResolvedValue(options.engravers),
      getMints: vi.fn().mockResolvedValue(options.mints),
      getOrientations: vi.fn().mockResolvedValue(options.orientations),
      getShapes: vi.fn().mockResolvedValue(options.shapes),
      getTechniques: vi.fn().mockResolvedValue(options.techniques),
      getEdges: vi.fn().mockResolvedValue(options.edges),
      getRims: vi.fn().mockResolvedValue(options.rims),
      getThemes: vi.fn().mockResolvedValue(options.themes),
    }

    await expect(
      loadCoinCreatePageData({ role: "editor" }, dependencies)
    ).resolves.toStrictEqual({
      status: "success",
      options,
    })
  })
})

describe("CoinCreateRouteComponent", () => {
  it("renders the create page without a public Coin link", () => {
    const markup = renderToStaticMarkup(
      <CoinCreateRouteComponent
        loaderData={{
          isAllowed: true,
          options,
        }}
      />
    )

    expect(markup).toContain("Create Coin")
    expect(markup).toContain("Coin form")
    expect(markup).not.toContain("View public Coin page")
  })

  it("blocks creation with required lookup maintenance links when required options are missing", () => {
    const markup = renderToStaticMarkup(
      <CoinCreateRouteComponent
        loaderData={{
          isAllowed: true,
          options: {
            ...options,
            issuers: [],
          },
        }}
      />
    )

    expect(markup).toContain("Coin creation is blocked")
    expect(markup).toContain('href="/database/issuers"')
    expect(markup).toContain('href="/database/rulers"')
    expect(markup).toContain('href="/database/distributions"')
    expect(markup).toContain('href="/database/compositions"')
    expect(markup).toContain('href="/database/currencies"')
  })
})
