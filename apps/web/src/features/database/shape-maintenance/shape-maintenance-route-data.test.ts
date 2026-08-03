import type { Shape } from "@coin-archive/api"
import { describe, expect, it, vi } from "vitest"

import { SHAPE_AUTHORIZATION_ERROR } from "./actions"
import { loadShapeMaintenancePageData } from "./shape-maintenance-route-data"

const shapes: Shape[] = [
  {
    id: "2c717ddb-95a2-4dad-a280-f58a4779aee8",
    code: "reeded",
    name: "Reeded",
    version: 1,
    createdAt: "2026-08-02T10:15:30.000Z",
    updatedAt: "2026-08-02T10:15:30.000Z",
    etag: '"shape-version-1"',
  },
  {
    id: "98474ec9-cb4c-44c3-b876-6b1790190dd5",
    code: "plain",
    name: "Plain",
    version: 1,
    createdAt: "2026-08-02T10:15:30.000Z",
    updatedAt: "2026-08-02T10:15:30.000Z",
    etag: '"shape-version-1"',
  },
]

describe("loadShapeMaintenancePageData", () => {
  it.each(["authentication_required", "editor_access_required"])(
    "maps API %s problems to the current access-denied presentation",
    async (code) => {
      const listShapes = vi.fn().mockRejectedValue({
        data: { body: { code } },
      })

      await expect(
        loadShapeMaintenancePageData({ listShapes })
      ).resolves.toStrictEqual({
        status: "error",
        formError: SHAPE_AUTHORIZATION_ERROR,
      })
    }
  )

  it("loads every cursor page through the typed maintenance client", async () => {
    const listShapes = vi
      .fn()
      .mockResolvedValueOnce({ data: [shapes[0]], nextCursor: "next" })
      .mockResolvedValueOnce({ data: [shapes[1]], nextCursor: null })

    await expect(
      loadShapeMaintenancePageData({ listShapes })
    ).resolves.toStrictEqual({ status: "success", shapes })
    expect(listShapes).toHaveBeenNthCalledWith(1, {
      limit: 100,
      sort: "name",
      order: "asc",
    })
    expect(listShapes).toHaveBeenNthCalledWith(2, {
      cursor: "next",
      limit: 100,
      sort: "name",
      order: "asc",
    })
  })

  it("does not hide unexpected API failures as authorization failures", async () => {
    const failure = new Error("API unavailable")

    await expect(
      loadShapeMaintenancePageData({
        listShapes: vi.fn().mockRejectedValue(failure),
      })
    ).rejects.toBe(failure)
  })
})
