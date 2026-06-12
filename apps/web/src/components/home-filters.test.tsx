import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { HomeFilters } from "./home-filters"

const timestamp = new Date("2026-06-08T00:00:00.000Z")

describe("HomeFilters", () => {
  it("renders catalogue, issuer, and ruler selections in the new home filter bar", () => {
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
        selectedIssuerCode="spain"
        selectedRulerCode="felipe-vi"
      />
    )

    expect(markup).toContain("Standard Catalog of World Coins")
    expect(markup).toContain("KM")
    expect(markup).toContain("Spain")
    expect(markup).toContain("Felipe VI")
    expect(markup).toContain("Clear")
  })
})
