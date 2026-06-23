import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import type { CatalogueOption } from "@workspace/db"
import {
  CatalogueMaintenanceAccessDeniedPage,
  CatalogueMaintenancePage,
} from "./-database-page"

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router")

  return {
    ...actual,
    useRouter: () => ({
      invalidate: vi.fn().mockResolvedValue(undefined),
    }),
  }
})

const TEST_CATALOGUE_TIMESTAMP = new Date("2026-01-01T00:00:00.000Z")

function buildCatalogue(overrides: {
  id: string
  code: string
  title: string
}): CatalogueOption {
  return {
    ...overrides,
    createdAt: TEST_CATALOGUE_TIMESTAMP,
    updatedAt: TEST_CATALOGUE_TIMESTAMP,
  }
}

describe("CatalogueMaintenancePage", () => {
  it("renders the catalogues table", () => {
    const catalogues: CatalogueOption[] = [
      buildCatalogue({
        id: "catalogue-2",
        code: "RIC",
        title: "Roman Imperial Coinage",
      }),
      buildCatalogue({
        id: "catalogue-1",
        code: "KM",
        title: "Standard Catalog of World Coins",
      }),
    ]
    const markup = renderToStaticMarkup(
      <CatalogueMaintenancePage catalogues={catalogues} />
    )

    expect(markup).toContain("Filter catalogues...")
    expect(markup).toContain("<table")
    expect(markup).toContain("<thead")
    expect(markup).toContain("<tbody")
    expect(markup).toContain("Code")
    expect(markup).toContain("Title")
    expect(markup).toContain("RIC")
    expect(markup).toContain("Roman Imperial Coinage")
    expect(markup).toContain("KM")
    expect(markup).toContain("Standard Catalog of World Coins")
    expect(markup).toContain('aria-label="Actions"')
    expect(markup).toContain("Previous</button>")
    expect(markup).toContain("Next</button>")
    expect(markup).toContain('disabled=""')
  })
})

describe("CatalogueMaintenanceAccessDeniedPage", () => {
  it("renders a 403-style access-denied state for signed-in non-editors", () => {
    const markup = renderToStaticMarkup(
      <CatalogueMaintenanceAccessDeniedPage />
    )

    expect(markup).toContain("Access denied")
    expect(markup).toContain(
      "Only Editors and Admins can access catalogue maintenance."
    )
  })
})
