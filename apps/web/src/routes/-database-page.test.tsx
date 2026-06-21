import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import type { CatalogueOption } from "@workspace/db"

import {
  CatalogueMaintenanceAccessDeniedPage,
  CatalogueMaintenancePage,
} from "./database"

describe("CatalogueMaintenancePage", () => {
  it("renders a semantic Catalogue maintenance list in the shared private-page presentation", () => {
    const catalogues: CatalogueOption[] = [
      {
        id: "catalogue-2",
        code: "RIC",
        title: "Roman Imperial Coinage",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      },
      {
        id: "catalogue-1",
        code: "KM",
        title: "Standard Catalog of World Coins",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    ]
    const markup = renderToStaticMarkup(
      <CatalogueMaintenancePage catalogues={catalogues} />
    )

    expect(markup).toContain("Catalogue Maintenance")
    expect(markup).toContain("Maintain existing Catalogues.")
    expect(markup).toContain("Catalogues")
    expect(markup).toContain("<table")
    expect(markup).toContain("<thead")
    expect(markup).toContain("<tbody")
    expect(markup).toContain(">Code<")
    expect(markup).toContain(">Title<")
    expect(markup).toContain(">RIC<")
    expect(markup).toContain(">Roman Imperial Coinage<")
    expect(markup).toContain(">KM<")
    expect(markup).toContain(">Standard Catalog of World Coins<")
    expect(markup).not.toContain(
      "Catalogue maintenance for Catalogues will appear here later."
    )
  })
})

describe("CatalogueMaintenanceAccessDeniedPage", () => {
  it("renders a 403-style access-denied state for signed-in non-editors", () => {
    const markup = renderToStaticMarkup(
      <CatalogueMaintenanceAccessDeniedPage />
    )

    expect(markup).toContain("Catalogue Maintenance")
    expect(markup).toContain("Access denied")
    expect(markup).toContain(
      "Only Editors and Admins can access catalogue maintenance."
    )
  })
})
