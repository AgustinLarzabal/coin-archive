import { describe, expect, it, vi } from "vitest"

import {
  databaseMaintenanceSections,
  databaseSecondaryMenuItems,
} from "./-navigation-items"
import { loadDatabaseGeneralSummaryCounts } from "./index"

function pickNavigationIdentity({ to, label }: { to: string; label: string }) {
  return { to, label }
}

describe("databaseMaintenanceSections", () => {
  it("shares the same maintenance labels and routes as the database secondary menu", () => {
    expect(
      databaseMaintenanceSections.map(pickNavigationIdentity)
    ).toStrictEqual(
      databaseSecondaryMenuItems.slice(1).map(pickNavigationIdentity)
    )
  })
})

describe("loadDatabaseGeneralSummaryCounts", () => {
  it("rejects unauthenticated access at the child-route boundary", async () => {
    const getDatabaseGeneralSummaryCounts = vi.fn()

    await expect(
      loadDatabaseGeneralSummaryCounts(null, {
        getDatabaseGeneralSummaryCounts,
      })
    ).resolves.toStrictEqual({
      status: "error",
    })

    expect(getDatabaseGeneralSummaryCounts).not.toHaveBeenCalled()
  })

  it("rejects signed-in Collectors without editor access", async () => {
    const getDatabaseGeneralSummaryCounts = vi.fn()

    await expect(
      loadDatabaseGeneralSummaryCounts(
        { role: "collector" },
        { getDatabaseGeneralSummaryCounts }
      )
    ).resolves.toStrictEqual({
      status: "error",
    })

    expect(getDatabaseGeneralSummaryCounts).not.toHaveBeenCalled()
  })

  it("returns summary counts for Editors and Admins", async () => {
    const counts = {
      catalogues: 3,
      compositions: 5,
      currencies: 2,
      distributions: 4,
      edges: 7,
      engravers: 6,
      issuers: 8,
      orientations: 10,
      mints: 9,
    }
    const getDatabaseGeneralSummaryCounts = vi.fn().mockResolvedValue(counts)
    const allowedRoles = ["editor", "admin"] as const

    for (const role of allowedRoles) {
      await expect(
        loadDatabaseGeneralSummaryCounts(
          { role },
          { getDatabaseGeneralSummaryCounts }
        )
      ).resolves.toStrictEqual({
        status: "success",
        counts,
      })
    }
  })
})
