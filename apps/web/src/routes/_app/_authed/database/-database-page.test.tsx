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
  it("renders Catalogue create and edit forms", () => {
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

    expect(markup).toContain("Catalogues")
    expect(markup).toContain(
      "Add a Catalogue or edit an existing Catalogue Code and Catalogue Title."
    )
    expect(markup).toContain("Catalogue Code")
    expect(markup).toContain("Catalogue Title")
    expect(markup).toContain("Add Catalogue")
    expect(markup).toContain("<table")
    expect(markup).toContain("<thead")
    expect(markup).toContain("<tbody")
    expect(markup).toContain(">Code<")
    expect(markup).toContain(">Title<")
    expect(markup).toContain(">Actions<")
    expect(markup).toContain('name="code" value="RIC"')
    expect(markup).toContain('name="title" value="Roman Imperial Coinage"')
    expect(markup).toContain('name="code" value="KM"')
    expect(markup).toContain(
      'name="title" value="Standard Catalog of World Coins"'
    )
    expect(markup).toContain('placeholder="KM"')
    expect(markup).toContain('placeholder="Standard Catalog of World Coins"')
    expect(markup).toContain("Save</button>")
    expect(markup).toContain('disabled=""')
    expect(markup).toMatch(/<form id="[^"]+"><\/form>/)
    expect(markup).toMatch(/form="[^"]+"[^>]+name="code"/)
    expect(markup).toMatch(/form="[^"]+"[^>]+name="title"/)
    expect(markup).toContain("Reset</button>")
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
