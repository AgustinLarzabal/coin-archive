import type { DatabaseMaintenanceOverview } from "@coin-archive/api"
import { describe, expect, it, vi } from "vitest"

import { loadDatabaseOverviewPageData } from "./database-overview-route-data"

const counts: DatabaseMaintenanceOverview = {
  coins: 14,
  catalogues: 3,
  compositions: 5,
  currencies: 2,
  distributions: 4,
  edges: 7,
  rims: 11,
  shapes: 11,
  mintingTechniques: 9,
  engravers: 6,
  themes: 12,
  issuers: 8,
  rulers: 5,
  rulerGroups: 4,
  orientations: 10,
  mints: 9,
}

describe("loadDatabaseOverviewPageData", () => {
  it.each(["authentication_required", "editor_access_required"])(
    "maps the API %s problem to the current access-denied presentation",
    async (code) => {
      const getOverview = vi.fn().mockRejectedValue({
        data: { body: { code } },
      })

      await expect(
        loadDatabaseOverviewPageData({ getOverview })
      ).resolves.toStrictEqual({ isAllowed: false })
    }
  )

  it("loads counts through the typed maintenance API client", async () => {
    const getOverview = vi.fn().mockResolvedValue({ data: counts })

    await expect(
      loadDatabaseOverviewPageData({ getOverview })
    ).resolves.toStrictEqual({ isAllowed: true, counts })
    expect(getOverview).toHaveBeenCalledWith({})
  })

  it("does not hide unexpected API failures as authorization failures", async () => {
    const failure = new Error("API unavailable")

    await expect(
      loadDatabaseOverviewPageData({
        getOverview: vi.fn().mockRejectedValue(failure),
      })
    ).rejects.toBe(failure)
  })
})
