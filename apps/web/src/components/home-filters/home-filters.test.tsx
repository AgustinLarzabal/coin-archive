import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { RULER_FILTER_LABEL } from "../../lib/ruler-filter"
import { HomeFilters } from "./home-filters"

describe("HomeFilters", () => {
  it("renders only the supported home filters in the filter bar", () => {
    const markup = renderToStaticMarkup(
      <HomeFilters
        distributions={[
          {
            id: "distribution-1",
            code: "circulation",
            name: "Circulation",
          },
        ]}
        engravers={[
          {
            id: "engraver-1",
            code: "john-doe",
            name: "John Doe",
          },
        ]}
        issuers={[
          {
            id: "issuer-1",
            code: "spain",
            isoCode: "ES",
            name: "Spain",
          },
        ]}
        rulers={[
          {
            id: "ruler-1",
            code: "charles-iii",
            name: "Charles III",
            group: null,
          },
        ]}
        themes={[
          {
            id: "theme-1",
            code: "map",
            name: "Map",
          },
        ]}
        onFiltersChange={() => Promise.resolve()}
        selectedDistributionCode="circulation"
        selectedEngraverCode="john-doe"
        selectedIssuerCode="spain"
        selectedRulerCode="charles-iii"
        selectedThemeCode="map"
      />
    )

    expect(markup).toContain("Engraver")
    expect(markup).toContain("John Doe")
    expect(markup).toContain("Issuer")
    expect(markup).toContain("Spain")
    expect(markup).toContain("Distribution")
    expect(markup).toContain("Circulation")
    expect(markup).toContain("Theme")
    expect(markup).toContain("Map")
    expect(markup).toContain(RULER_FILTER_LABEL)
    expect(markup).toContain("Charles III")
    expect(markup).toContain("Clear")
    expect(markup).not.toContain("Catalogue")
    expect(markup).not.toContain("Composition")
    expect(markup).not.toContain("Currency")
    expect(markup).not.toContain("Demonetization Status")
    expect(markup).not.toContain("Edge")
    expect(markup).not.toContain("Minting Technique")
    expect(markup).not.toContain("Issue Year")
    expect(markup).not.toContain("Reference number")
    expect(markup).not.toContain("Face Value")
    expect(markup).not.toContain("Weight")
    expect(markup).not.toContain("Diameter")
    expect(markup).not.toContain("Thickness")
    expect(markup).not.toContain("Mint")
    expect(markup).not.toContain("Orientation")
    expect(markup).not.toContain("Rim")
    expect(markup).not.toContain("Shape")
  })
})
