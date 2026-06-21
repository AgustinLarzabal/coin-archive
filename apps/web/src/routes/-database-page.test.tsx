import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import {
  CatalogueMaintenanceAccessDeniedPage,
  CatalogueMaintenancePage,
} from "./database"

describe("CatalogueMaintenancePage", () => {
  it("renders the Catalogue Maintenance placeholder in the shared private-page presentation", () => {
    const markup = renderToStaticMarkup(<CatalogueMaintenancePage />)

    expect(markup).toContain("Catalogue Maintenance")
    expect(markup).toContain(
      "Maintain catalogue data here as Editor and Admin tools are added."
    )
    expect(markup).toContain("Catalogues")
    expect(markup).toContain(
      "Catalogue maintenance for Catalogues will appear here later."
    )
    expect(markup).not.toContain("<form")
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
