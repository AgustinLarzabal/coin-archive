import type { Catalogue } from "@coin-archive/api"
import { describe, expect, it, vi } from "vitest"

import { CATALOGUE_AUTHORIZATION_ERROR } from "./actions"
import { loadCatalogueMaintenancePageData } from "./catalogue-maintenance-route-data"

const catalogues: Catalogue[] = [
  {
    id: "2c717ddb-95a2-4dad-a280-f58a4779aee8",
    code: "KM",
    title: "Standard Catalog of World Coins",
    version: 1,
    createdAt: "2026-08-02T10:15:30.000Z",
    updatedAt: "2026-08-02T10:15:30.000Z",
    etag: '"catalogue-version-1"',
  },
  {
    id: "98474ec9-cb4c-44c3-b876-6b1790190dd5",
    code: "RIC",
    title: "Roman Imperial Coinage",
    version: 1,
    createdAt: "2026-08-02T10:15:30.000Z",
    updatedAt: "2026-08-02T10:15:30.000Z",
    etag: '"catalogue-version-1"',
  },
]

describe("loadCatalogueMaintenancePageData", () => {
  it.each(["UNAUTHORIZED", "FORBIDDEN"])(
    "maps API %s problems to the current access-denied presentation",
    async (code) => {
      const listCatalogues = vi.fn().mockRejectedValue({ code })

      await expect(
        loadCatalogueMaintenancePageData({ listCatalogues })
      ).resolves.toStrictEqual({
        status: "error",
        formError: CATALOGUE_AUTHORIZATION_ERROR,
      })
    }
  )

  it("loads every cursor page through the typed maintenance client", async () => {
    const listCatalogues = vi
      .fn()
      .mockResolvedValueOnce({ data: [catalogues[0]], nextCursor: "next" })
      .mockResolvedValueOnce({ data: [catalogues[1]], nextCursor: null })

    await expect(
      loadCatalogueMaintenancePageData({ listCatalogues })
    ).resolves.toStrictEqual({ status: "success", catalogues })
    expect(listCatalogues).toHaveBeenNthCalledWith(1, {
      limit: 100,
      sort: "title",
      order: "asc",
    })
    expect(listCatalogues).toHaveBeenNthCalledWith(2, {
      cursor: "next",
      limit: 100,
      sort: "title",
      order: "asc",
    })
  })

  it("does not hide unexpected API failures as authorization failures", async () => {
    const failure = new Error("API unavailable")

    await expect(
      loadCatalogueMaintenancePageData({
        listCatalogues: vi.fn().mockRejectedValue(failure),
      })
    ).rejects.toBe(failure)
  })
})
