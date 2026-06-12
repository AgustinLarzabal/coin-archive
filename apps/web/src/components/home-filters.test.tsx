import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { HomeFilters } from "./home-filters"

const timestamp = new Date("2026-06-08T00:00:00.000Z")

describe("HomeFilters", () => {
  it("renders catalogue, composition, currency, edge, issuer, and ruler selections in the new home filter bar", () => {
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
        selectedEdgeCode="reeded"
        selectedIssuerCode="spain"
        selectedRulerCode="felipe-vi"
      />
    )

    expect(markup).toContain("Standard Catalog of World Coins")
    expect(markup).toContain("KM")
    expect(markup).toContain("Silver (.900)")
    expect(markup).toContain("Euro")
    expect(markup).toContain("Reeded")
    expect(markup).toContain("Spain")
    expect(markup).toContain("Felipe VI")
    expect(markup).toContain("Clear")
  })
})
