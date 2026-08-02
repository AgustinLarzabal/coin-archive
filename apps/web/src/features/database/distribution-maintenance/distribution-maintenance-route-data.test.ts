import type { Distribution } from "@coin-archive/api"
import { describe, expect, it, vi } from "vitest"

import { DISTRIBUTION_AUTHORIZATION_ERROR } from "./actions"
import { loadDistributionMaintenancePageData } from "./distribution-maintenance-route-data"

const distributions: Distribution[] = [
  {
    id: "2c717ddb-95a2-4dad-a280-f58a4779aee8",
    code: "silver",
    name: "Silver",
    version: 1,
    createdAt: "2026-08-02T10:15:30.000Z",
    updatedAt: "2026-08-02T10:15:30.000Z",
    etag: '"distribution-version-1"',
  },
  {
    id: "98474ec9-cb4c-44c3-b876-6b1790190dd5",
    code: "gold",
    name: "Gold",
    version: 1,
    createdAt: "2026-08-02T10:15:30.000Z",
    updatedAt: "2026-08-02T10:15:30.000Z",
    etag: '"distribution-version-1"',
  },
]

describe("loadDistributionMaintenancePageData", () => {
  it.each(["UNAUTHORIZED", "FORBIDDEN"])(
    "maps API %s problems to the current access-denied presentation",
    async (code) => {
      const listDistributions = vi.fn().mockRejectedValue({ code })

      await expect(
        loadDistributionMaintenancePageData({ listDistributions })
      ).resolves.toStrictEqual({
        status: "error",
        formError: DISTRIBUTION_AUTHORIZATION_ERROR,
      })
    }
  )

  it("loads every cursor page through the typed maintenance client", async () => {
    const listDistributions = vi
      .fn()
      .mockResolvedValueOnce({ data: [distributions[0]], nextCursor: "next" })
      .mockResolvedValueOnce({ data: [distributions[1]], nextCursor: null })

    await expect(
      loadDistributionMaintenancePageData({ listDistributions })
    ).resolves.toStrictEqual({ status: "success", distributions })
    expect(listDistributions).toHaveBeenNthCalledWith(1, {
      limit: 100,
      sort: "name",
      order: "asc",
    })
    expect(listDistributions).toHaveBeenNthCalledWith(2, {
      cursor: "next",
      limit: 100,
      sort: "name",
      order: "asc",
    })
  })

  it("does not hide unexpected API failures as authorization failures", async () => {
    const failure = new Error("API unavailable")

    await expect(
      loadDistributionMaintenancePageData({
        listDistributions: vi.fn().mockRejectedValue(failure),
      })
    ).rejects.toBe(failure)
  })
})
