import type { Orientation } from "@coin-archive/api"
import { describe, expect, it, vi } from "vitest"

import { ORIENTATION_AUTHORIZATION_ERROR } from "./actions"
import { loadOrientationMaintenanceOrientations } from "./orientation-maintenance-route-data"

const orientations: Orientation[] = [
  {
    id: "645c07ac-cfbb-4a29-b056-9680634c6c2c",
    code: "coin-alignment",
    name: "Coin alignment",
    version: 1,
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
    etag: '"coin-alignment-version-1"',
  },
  {
    id: "9c65c9ed-eb9d-4cf5-986f-1346d6a326ca",
    code: "medal-alignment",
    name: "Medal alignment",
    version: 1,
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
    etag: '"medal-alignment-version-1"',
  },
]

describe("loadOrientationMaintenanceOrientations", () => {
  it.each(["UNAUTHORIZED", "FORBIDDEN"])(
    "maps API %s problems to the current access-denied presentation",
    async (code) => {
      const listOrientations = vi.fn().mockRejectedValue({ code })

      await expect(
        loadOrientationMaintenanceOrientations({ listOrientations })
      ).resolves.toStrictEqual({
        status: "error",
        formError: ORIENTATION_AUTHORIZATION_ERROR,
      })
    }
  )

  it("loads every cursor page through the typed maintenance client", async () => {
    const listOrientations = vi
      .fn()
      .mockResolvedValueOnce({ data: [orientations[0]], nextCursor: "next" })
      .mockResolvedValueOnce({ data: [orientations[1]], nextCursor: null })

    await expect(
      loadOrientationMaintenanceOrientations({ listOrientations })
    ).resolves.toStrictEqual({
      status: "success",
      orientations,
    })
    expect(listOrientations).toHaveBeenNthCalledWith(1, {
      limit: 100,
      sort: "name",
      order: "asc",
    })
    expect(listOrientations).toHaveBeenNthCalledWith(2, {
      cursor: "next",
      limit: 100,
      sort: "name",
      order: "asc",
    })
  })

  it("does not hide unexpected API failures as authorization failures", async () => {
    const failure = new Error("API unavailable")

    await expect(
      loadOrientationMaintenanceOrientations({
        listOrientations: vi.fn().mockRejectedValue(failure),
      })
    ).rejects.toBe(failure)
  })
})
