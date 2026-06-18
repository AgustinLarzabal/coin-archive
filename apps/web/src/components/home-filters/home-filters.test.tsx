import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { HomeFilters } from "./home-filters"

describe("HomeFilters", () => {
  it("renders only the supported home filters in the filter bar", () => {
    const markup = renderToStaticMarkup(
      <HomeFilters
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
        onFiltersChange={() => Promise.resolve()}
        selectedEngraverCode="john-doe"
        selectedIssuerCode="spain"
      />
    )

    expect(markup).toContain("Engraver")
    expect(markup).toContain("John Doe")
    expect(markup).toContain("Issuer")
    expect(markup).toContain("Spain")
    expect(markup).toContain("Clear")
    expect(markup).not.toContain("Catalogue")
    expect(markup).not.toContain("Composition")
    expect(markup).not.toContain("Currency")
    expect(markup).not.toContain("Distribution")
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
    expect(markup).not.toContain("Theme")
    expect(markup).not.toContain("Ruler")
  })
})
