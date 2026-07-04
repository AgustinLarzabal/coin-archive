import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import {
  CATALOGUE_AUTHORIZATION_ERROR,
} from "@/lib/catalogue-maintenance"

import {
  loadCatalogueMaintenanceCatalogues,
  renderDatabaseCataloguesPage,
} from "./catalogues"

vi.mock("@/components/access-denied", () => ({
  AccessDenied: () => "Access denied",
}))

describe("loadCatalogueMaintenanceCatalogues", () => {
  it("rejects unauthenticated access at the server-function boundary", async () => {
    const getCatalogues = vi.fn()

    await expect(
      loadCatalogueMaintenanceCatalogues(null, { getCatalogues })
    ).resolves.toStrictEqual({
      status: "error",
      formError: CATALOGUE_AUTHORIZATION_ERROR,
    })

    expect(getCatalogues).not.toHaveBeenCalled()
  })

  it("rejects signed-in Collectors without editor access", async () => {
    const getCatalogues = vi.fn()

    await expect(
      loadCatalogueMaintenanceCatalogues({ role: "collector" }, { getCatalogues })
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
      loadCatalogueMaintenanceCatalogues({ role: "editor" }, { getCatalogues })
    ).resolves.toStrictEqual({
      status: "success",
      catalogues,
    })

    await expect(
      loadCatalogueMaintenanceCatalogues({ role: "admin" }, { getCatalogues })
    ).resolves.toStrictEqual({
      status: "success",
      catalogues,
    })
  })
})

describe("renderDatabaseCataloguesPage", () => {
  it("renders the existing access-denied UI for disallowed Collectors", () => {
    const markup = renderToStaticMarkup(
      renderDatabaseCataloguesPage({ isAllowed: false })
    )

    expect(markup).toContain("Access denied")
  })

  it("renders the Catalogues table for allowed Editors and Admins", () => {
    const markup = renderToStaticMarkup(
      renderDatabaseCataloguesPage({
        isAllowed: true,
        catalogues: [
          {
            id: "2c717ddb-95a2-4dad-a280-f58a4779aee8",
            code: "KM",
            title: "Standard Catalog of World Coins",
          },
          {
            id: "8f09689c-6080-4f0e-b3ea-fdcb9ea1f767",
            code: "Y",
            title: "World Coin Catalog",
          },
        ],
      })
    )

    expect(markup).toContain("Code")
    expect(markup).toContain("Title")
    expect(markup).toContain("Standard Catalog of World Coins")
    expect(markup).toContain("World Coin Catalog")
  })
})
