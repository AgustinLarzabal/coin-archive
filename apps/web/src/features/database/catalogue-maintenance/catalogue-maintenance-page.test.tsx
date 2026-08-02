import { renderToStaticMarkup } from "react-dom/server"
import type { Catalogue } from "@coin-archive/api"
import { describe, expect, it, vi } from "vitest"

import { CatalogueMaintenanceRouteComponent } from "./catalogue-maintenance-page"

vi.mock("@/components/access-denied", () => ({
  AccessDenied: () => "Access denied",
}))

vi.mock("./table-workflow/catalogues-table", () => ({
  CataloguesTable: ({ catalogues }: { catalogues: Catalogue[] }) =>
    `Catalogues table: ${catalogues.map((catalogue) => catalogue.title).join(", ")}`,
}))

describe("CatalogueMaintenanceRouteComponent", () => {
  it("renders the existing access-denied UI for disallowed Collectors", () => {
    const markup = renderToStaticMarkup(
      <CatalogueMaintenanceRouteComponent loaderData={{ isAllowed: false }} />
    )

    expect(markup).toContain("Access denied")
  })

  it("renders the Catalogue maintenance table for allowed Editors and Admins", () => {
    const markup = renderToStaticMarkup(
      <CatalogueMaintenanceRouteComponent
        loaderData={{
          isAllowed: true,
          catalogues: [
            {
              id: "2c717ddb-95a2-4dad-a280-f58a4779aee8",
              code: "KM",
              title: "Standard Catalog of World Coins",
              version: 1,
              createdAt: "2026-07-01T00:00:00.000Z",
              updatedAt: "2026-07-01T00:00:00.000Z",
              etag: '"catalogue-version-1"',
            },
          ],
        }}
      />
    )

    expect(markup).toContain("Catalogues table:")
    expect(markup).toContain("Standard Catalog of World Coins")
  })
})
