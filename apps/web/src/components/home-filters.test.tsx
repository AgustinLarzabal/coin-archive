import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { HomeFilters } from "./home-filters"

const timestamp = new Date("2026-06-08T00:00:00.000Z")

describe("HomeFilters", () => {
  it("renders catalogue, composition, currency, distribution, demonetization, edge, engraver, mint, orientation, rim, shape, minting technique, theme, issuer, and ruler selections in the new home filter bar", () => {
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
        distributions={[
          {
            id: "distribution-1",
            code: "standard-circulation",
            name: "Standard circulation",
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
        engravers={[
          {
            id: "engraver-1",
            code: "georgios-stamatopoulos",
            name: "Georgios Stamatopoulos",
            createdAt: timestamp,
            updatedAt: timestamp,
          },
        ]}
        mints={[
          {
            id: "mint-1",
            code: "royal-mint-of-madrid",
            name: "Royal Mint of Madrid",
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
        shapes={[
          {
            id: "shape-1",
            code: "round",
            name: "Round",
            createdAt: timestamp,
            updatedAt: timestamp,
          },
        ]}
        techniques={[
          {
            id: "technique-1",
            code: "milled",
            name: "Milled",
            createdAt: timestamp,
            updatedAt: timestamp,
          },
        ]}
        themes={[
          {
            id: "theme-1",
            code: "map",
            name: "Map",
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
        selectedDistributionCode="standard-circulation"
        selectedDemonetization="not-demonetized"
        selectedEdgeCode="reeded"
        selectedEngraverCode="georgios-stamatopoulos"
        selectedIssuerCode="spain"
        selectedMintCode="royal-mint-of-madrid"
        selectedOrientationCode="coin-alignment"
        selectedRimCode="raised-both-sides"
        selectedShapeCode="round"
        selectedTechniqueCode="milled"
        selectedThemeCode="map"
        selectedRulerCode="felipe-vi"
      />
    )

    expect(markup).toContain("Standard Catalog of World Coins")
    expect(markup).toContain("KM")
    expect(markup).toContain("Silver (.900)")
    expect(markup).toContain("Euro")
    expect(markup).toContain("Standard circulation")
    expect(markup).toContain("Not demonetized")
    expect(markup).toContain("Reeded")
    expect(markup).toContain("Georgios Stamatopoulos")
    expect(markup).toContain("Royal Mint of Madrid")
    expect(markup).toContain("Coin alignment")
    expect(markup).toContain("Raised, both sides")
    expect(markup).toContain("Round")
    expect(markup).toContain("Milled")
    expect(markup).toContain("Map")
    expect(markup).toContain("Spain")
    expect(markup).toContain("Felipe VI")
    expect(markup).toContain("Clear")
  })
})
