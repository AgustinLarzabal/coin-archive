import type { Edge } from "@coin-archive/api"
import { describe, expect, it, vi } from "vitest"

import { EDGE_AUTHORIZATION_ERROR } from "./actions"
import { loadEdgeMaintenancePageData } from "./edge-maintenance-route-data"

const edges: Edge[] = [
  {
    id: "2c717ddb-95a2-4dad-a280-f58a4779aee8",
    code: "reeded",
    name: "Reeded",
    version: 1,
    createdAt: "2026-08-02T10:15:30.000Z",
    updatedAt: "2026-08-02T10:15:30.000Z",
    etag: '"edge-version-1"',
  },
  {
    id: "98474ec9-cb4c-44c3-b876-6b1790190dd5",
    code: "plain",
    name: "Plain",
    version: 1,
    createdAt: "2026-08-02T10:15:30.000Z",
    updatedAt: "2026-08-02T10:15:30.000Z",
    etag: '"edge-version-1"',
  },
]

describe("loadEdgeMaintenancePageData", () => {
  it.each(["UNAUTHORIZED", "FORBIDDEN"])(
    "maps API %s problems to the current access-denied presentation",
    async (code) => {
      const listEdges = vi.fn().mockRejectedValue({ code })

      await expect(
        loadEdgeMaintenancePageData({ listEdges })
      ).resolves.toStrictEqual({
        status: "error",
        formError: EDGE_AUTHORIZATION_ERROR,
      })
    }
  )

  it("loads every cursor page through the typed maintenance client", async () => {
    const listEdges = vi
      .fn()
      .mockResolvedValueOnce({ data: [edges[0]], nextCursor: "next" })
      .mockResolvedValueOnce({ data: [edges[1]], nextCursor: null })

    await expect(
      loadEdgeMaintenancePageData({ listEdges })
    ).resolves.toStrictEqual({ status: "success", edges })
    expect(listEdges).toHaveBeenNthCalledWith(1, {
      limit: 100,
      sort: "name",
      order: "asc",
    })
    expect(listEdges).toHaveBeenNthCalledWith(2, {
      cursor: "next",
      limit: 100,
      sort: "name",
      order: "asc",
    })
  })

  it("does not hide unexpected API failures as authorization failures", async () => {
    const failure = new Error("API unavailable")

    await expect(
      loadEdgeMaintenancePageData({
        listEdges: vi.fn().mockRejectedValue(failure),
      })
    ).rejects.toBe(failure)
  })
})
