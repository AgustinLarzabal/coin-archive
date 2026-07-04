import { describe, expect, it, vi } from "vitest"

import { CATALOGUE_AUTHORIZATION_ERROR } from "@/lib/catalogue-maintenance"

import { loadCatalogueMaintenanceCatalogues } from "./catalogues"

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
      loadCatalogueMaintenanceCatalogues(
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
