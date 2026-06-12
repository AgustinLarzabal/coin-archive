import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { HomeFilters } from "./home-filters"

const timestamp = new Date("2026-06-08T00:00:00.000Z")

describe("HomeFilters", () => {
  it("renders catalogue, composition, currency, demonetization, edge, orientation, rim, issuer, and ruler selections in the new home filter bar", () => {
    const markup = renderToStaticMarkup(
      <HomeFilters
        catalogues={[
          {
            id: "catalogue-1",
            code: "KM",
            title: "Standard Catalog of World Coins",
            createdAt: timestamp,
            updatedAt: timestamp,
          },
        ]}
        compositions={[
          {
            id: "composition-1",
            code: "silver-900",
            name: "Silver (.900)",
            description: null,
            createdAt: timestamp,
            updatedAt: timestamp,
          },
        ]}
        currencies={[
          {
            id: "currency-1",
            code: "euro",
            name: "Euro",
            fullName: "Euro (2002-date)",
            createdAt: timestamp,
            updatedAt: timestamp,
          },
        ]}
        edges={[
          {
            id: "edge-1",
            code: "reeded",
            name: "Reeded",
            createdAt: timestamp,
            updatedAt: timestamp,
          },
        ]}
        orientations={[
          {
            id: "orientation-1",
            code: "coin-alignment",
            name: "Coin alignment",
            createdAt: timestamp,
            updatedAt: timestamp,
          },
        ]}
        rims={[
          {
            id: "rim-1",
            code: "raised-both-sides",
            name: "Raised, both sides",
            createdAt: timestamp,
            updatedAt: timestamp,
          },
        ]}
        issuers={[
          {
            code: "spain",
            isoCode: "ES",
            name: "Spain",
          },
        ]}
        onFiltersChange={() => Promise.resolve()}
        rulers={[
          {
            code: "felipe-vi",
            name: "Felipe VI",
            group: null,
          },
        ]}
        selectedCatalogueCode="KM"
        selectedCompositionCode="silver-900"
        selectedCurrencyCode="euro"
        selectedDemonetization="not-demonetized"
        selectedEdgeCode="reeded"
        selectedIssuerCode="spain"
        selectedOrientationCode="coin-alignment"
        selectedRimCode="raised-both-sides"
        selectedRulerCode="felipe-vi"
      />
    )

    expect(markup).toContain("Standard Catalog of World Coins")
    expect(markup).toContain("KM")
    expect(markup).toContain("Silver (.900)")
    expect(markup).toContain("Euro")
    expect(markup).toContain("Not demonetized")
    expect(markup).toContain("Reeded")
    expect(markup).toContain("Coin alignment")
    expect(markup).toContain("Raised, both sides")
    expect(markup).toContain("Spain")
    expect(markup).toContain("Felipe VI")
    expect(markup).toContain("Clear")
  })
})
