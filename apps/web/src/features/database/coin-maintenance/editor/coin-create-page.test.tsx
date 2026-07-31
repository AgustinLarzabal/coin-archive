import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { CoinCreateRouteComponent } from "./coin-create-page"

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
