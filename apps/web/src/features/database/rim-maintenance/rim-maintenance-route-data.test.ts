import type { Rim } from "@coin-archive/api"
import { describe, expect, it, vi } from "vitest"

import { RIM_AUTHORIZATION_ERROR } from "./actions"
import { loadRimMaintenancePageData } from "./rim-maintenance-route-data"

const rims: Rim[] = [
  {
    id: "2c717ddb-95a2-4dad-a280-f58a4779aee8",
    code: "reeded",
    name: "Reeded",
    version: 1,
    createdAt: "2026-08-02T10:15:30.000Z",
    updatedAt: "2026-08-02T10:15:30.000Z",
    etag: '"rim-version-1"',
  },
  {
    id: "98474ec9-cb4c-44c3-b876-6b1790190dd5",
    code: "plain",
    name: "Plain",
    version: 1,
    createdAt: "2026-08-02T10:15:30.000Z",
    updatedAt: "2026-08-02T10:15:30.000Z",
    etag: '"rim-version-1"',
  },
]

describe("loadRimMaintenancePageData", () => {
  it.each(["authentication_required", "editor_access_required"])(
    "maps API %s problems to the current access-denied presentation",
    async (code) => {
      const listRims = vi.fn().mockRejectedValue({
        data: { body: { code } },
      })

      await expect(
        loadRimMaintenancePageData({ listRims })
      ).resolves.toStrictEqual({
        status: "error",
        formError: RIM_AUTHORIZATION_ERROR,
      })
    }
  )

  it("loads every cursor page through the typed maintenance client", async () => {
    const listRims = vi
      .fn()
      .mockResolvedValueOnce({ data: [rims[0]], nextCursor: "next" })
      .mockResolvedValueOnce({ data: [rims[1]], nextCursor: null })

    await expect(
      loadRimMaintenancePageData({ listRims })
    ).resolves.toStrictEqual({ status: "success", rims })
    expect(listRims).toHaveBeenNthCalledWith(1, {
      limit: 100,
      sort: "name",
      order: "asc",
    })
    expect(listRims).toHaveBeenNthCalledWith(2, {
      cursor: "next",
      limit: 100,
      sort: "name",
      order: "asc",
    })
  })

  it("does not hide unexpected API failures as authorization failures", async () => {
    const failure = new Error("API unavailable")

    await expect(
      loadRimMaintenancePageData({
        listRims: vi.fn().mockRejectedValue(failure),
      })
    ).rejects.toBe(failure)
  })
})
