import type { Composition } from "@coin-archive/api"
import { describe, expect, it, vi } from "vitest"

import { COMPOSITION_AUTHORIZATION_ERROR } from "./actions"
import { loadCompositionMaintenancePageData } from "./composition-maintenance-route-data"

const compositions: Composition[] = [
  {
    id: "2c717ddb-95a2-4dad-a280-f58a4779aee8",
    code: "silver",
    name: "Silver",
    version: 1,
    createdAt: "2026-08-02T10:15:30.000Z",
    updatedAt: "2026-08-02T10:15:30.000Z",
    etag: '"composition-version-1"',
  },
  {
    id: "98474ec9-cb4c-44c3-b876-6b1790190dd5",
    code: "gold",
    name: "Gold",
    version: 1,
    createdAt: "2026-08-02T10:15:30.000Z",
    updatedAt: "2026-08-02T10:15:30.000Z",
    etag: '"composition-version-1"',
  },
]

describe("loadCompositionMaintenancePageData", () => {
  it.each(["UNAUTHORIZED", "FORBIDDEN"])(
    "maps API %s problems to the current access-denied presentation",
    async (code) => {
      const listCompositions = vi.fn().mockRejectedValue({ code })

      await expect(
        loadCompositionMaintenancePageData({ listCompositions })
      ).resolves.toStrictEqual({
        status: "error",
        formError: COMPOSITION_AUTHORIZATION_ERROR,
      })
    }
  )

  it("loads every cursor page through the typed maintenance client", async () => {
    const listCompositions = vi
      .fn()
      .mockResolvedValueOnce({ data: [compositions[0]], nextCursor: "next" })
      .mockResolvedValueOnce({ data: [compositions[1]], nextCursor: null })

    await expect(
      loadCompositionMaintenancePageData({ listCompositions })
    ).resolves.toStrictEqual({ status: "success", compositions })
    expect(listCompositions).toHaveBeenNthCalledWith(1, {
      limit: 100,
      sort: "name",
      order: "asc",
    })
    expect(listCompositions).toHaveBeenNthCalledWith(2, {
      cursor: "next",
      limit: 100,
      sort: "name",
      order: "asc",
    })
  })

  it("does not hide unexpected API failures as authorization failures", async () => {
    const failure = new Error("API unavailable")

    await expect(
      loadCompositionMaintenancePageData({
        listCompositions: vi.fn().mockRejectedValue(failure),
      })
    ).rejects.toBe(failure)
  })
})
