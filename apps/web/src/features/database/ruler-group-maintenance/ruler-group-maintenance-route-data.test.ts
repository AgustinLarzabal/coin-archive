import type { RulerGroup } from "@coin-archive/api"
import { describe, expect, it, vi } from "vitest"

import { RULER_GROUP_AUTHORIZATION_ERROR } from "./actions"
import { loadRulerGroupMaintenancePageData } from "./ruler-group-maintenance-route-data"

const rulerGroups: RulerGroup[] = [
  {
    id: "2c717ddb-95a2-4dad-a280-f58a4779aee8",
    code: "reeded",
    name: "Reeded",
    version: 1,
    createdAt: "2026-08-02T10:15:30.000Z",
    updatedAt: "2026-08-02T10:15:30.000Z",
    etag: '"ruler-group-version-1"',
  },
  {
    id: "98474ec9-cb4c-44c3-b876-6b1790190dd5",
    code: "plain",
    name: "Plain",
    version: 1,
    createdAt: "2026-08-02T10:15:30.000Z",
    updatedAt: "2026-08-02T10:15:30.000Z",
    etag: '"ruler-group-version-1"',
  },
]

describe("loadRulerGroupMaintenancePageData", () => {
  it.each(["authentication_required", "editor_access_required"])(
    "maps API %s problems to the current access-denied presentation",
    async (code) => {
      const listRulerGroups = vi.fn().mockRejectedValue({
        data: { body: { code } },
      })

      await expect(
        loadRulerGroupMaintenancePageData({ listRulerGroups })
      ).resolves.toStrictEqual({
        status: "error",
        formError: RULER_GROUP_AUTHORIZATION_ERROR,
      })
    }
  )

  it("loads every cursor page through the typed maintenance client", async () => {
    const listRulerGroups = vi
      .fn()
      .mockResolvedValueOnce({
        data: [rulerGroups[0]],
        nextCursor: "next",
      })
      .mockResolvedValueOnce({ data: [rulerGroups[1]], nextCursor: null })

    await expect(
      loadRulerGroupMaintenancePageData({ listRulerGroups })
    ).resolves.toStrictEqual({ status: "success", rulerGroups })
    expect(listRulerGroups).toHaveBeenNthCalledWith(1, {
      limit: 100,
      sort: "name",
      order: "asc",
    })
    expect(listRulerGroups).toHaveBeenNthCalledWith(2, {
      cursor: "next",
      limit: 100,
      sort: "name",
      order: "asc",
    })
  })

  it("does not hide unexpected API failures as authorization failures", async () => {
    const failure = new Error("API unavailable")

    await expect(
      loadRulerGroupMaintenancePageData({
        listRulerGroups: vi.fn().mockRejectedValue(failure),
      })
    ).rejects.toBe(failure)
  })
})
