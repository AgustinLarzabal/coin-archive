import { renderToStaticMarkup } from "react-dom/server"
import type { CatalogueOption } from "@workspace/db"
import { describe, expect, it, vi } from "vitest"

import { CATALOGUE_AUTHORIZATION_ERROR } from "./actions"

import {
  loadCatalogueMaintenancePageData,
  renderCatalogueMaintenancePage,
} from "./catalogue-maintenance-page"

vi.mock("@/components/access-denied", () => ({
  AccessDenied: () => "Access denied",
}))

vi.mock("./table-workflow/catalogues-table", () => ({
  CataloguesTable: ({ catalogues }: { catalogues: CatalogueOption[] }) =>
    `Catalogues table: ${catalogues.map((catalogue) => catalogue.title).join(", ")}`,
}))

const catalogueTimestamps = {
  createdAt: new Date("2026-07-01T00:00:00.000Z"),
  updatedAt: new Date("2026-07-01T00:00:00.000Z"),
} as const

describe("loadCatalogueMaintenancePageData", () => {
  it("rejects unauthenticated access at the server-function boundary", async () => {
    const getCatalogues = vi.fn()

    await expect(
      loadCatalogueMaintenancePageData(null, { getCatalogues })
    ).resolves.toStrictEqual({
      status: "error",
      formError: CATALOGUE_AUTHORIZATION_ERROR,
    })

    expect(getCatalogues).not.toHaveBeenCalled()
  })

  it("rejects signed-in Collectors without editor access", async () => {
    const getCatalogues = vi.fn()

    await expect(
      loadCatalogueMaintenancePageData(
        { role: "collector" },
        { getCatalogues }
      )
    ).resolves.toStrictEqual({
      status: "error",
      formError: CATALOGUE_AUTHORIZATION_ERROR,
    })

    expect(getCatalogues).not.toHaveBeenCalled()
  })

  it("returns catalogue data for Editors and Admins", async () => {
    const catalogues = [
      {
        id: "2c717ddb-95a2-4dad-a280-f58a4779aee8",
        code: "KM",
        title: "Standard Catalog of World Coins",
      },
    ]
    const getCatalogues = vi.fn().mockResolvedValue(catalogues)

    await expect(
      loadCatalogueMaintenancePageData({ role: "editor" }, { getCatalogues })
    ).resolves.toStrictEqual({
      status: "success",
      catalogues,
    })

    await expect(
      loadCatalogueMaintenancePageData({ role: "admin" }, { getCatalogues })
    ).resolves.toStrictEqual({
      status: "success",
      catalogues,
    })
  })
})

describe("renderCatalogueMaintenancePage", () => {
  it("renders the existing access-denied UI for disallowed Collectors", () => {
    const markup = renderToStaticMarkup(
      renderCatalogueMaintenancePage({ isAllowed: false })
    )

    expect(markup).toContain("Access denied")
  })

  it("renders the Catalogue maintenance table for allowed Editors and Admins", () => {
    const markup = renderToStaticMarkup(
      renderCatalogueMaintenancePage({
        isAllowed: true,
        catalogues: [
          {
            ...catalogueTimestamps,
            id: "2c717ddb-95a2-4dad-a280-f58a4779aee8",
            code: "KM",
            title: "Standard Catalog of World Coins",
          },
        ],
      })
    )

    expect(markup).toContain("Catalogues table:")
    expect(markup).toContain("Standard Catalog of World Coins")
  })
})
