import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import {
  loadDatabaseOverviewPageData,
  renderDatabaseOverviewPage,
} from "./database-overview-page"

vi.mock("@/components/access-denied", () => ({
  AccessDenied: () => "Access denied",
}))

vi.mock("./database-overview-table", () => ({
  DatabaseOverviewTable: () => "Database overview table",
}))

const counts = {
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
} as const

describe("loadDatabaseOverviewPageData", () => {
  it("rejects unauthenticated access at the child-route boundary", async () => {
    const getDatabaseGeneralSummaryCounts = vi.fn()

    await expect(
      loadDatabaseOverviewPageData(null, {
        getDatabaseGeneralSummaryCounts,
      })
    ).resolves.toStrictEqual({
      isAllowed: false,
    })

    expect(getDatabaseGeneralSummaryCounts).not.toHaveBeenCalled()
  })

  it("rejects signed-in Collectors without editor access", async () => {
    const getDatabaseGeneralSummaryCounts = vi.fn()

    await expect(
      loadDatabaseOverviewPageData(
        { role: "collector" },
        { getDatabaseGeneralSummaryCounts }
      )
    ).resolves.toStrictEqual({
      isAllowed: false,
    })

    expect(getDatabaseGeneralSummaryCounts).not.toHaveBeenCalled()
  })

  it("returns summary counts for Editors and Admins", async () => {
    const getDatabaseGeneralSummaryCounts = vi.fn().mockResolvedValue(counts)
    const allowedRoles = ["editor", "admin"] as const

    for (const role of allowedRoles) {
      await expect(
        loadDatabaseOverviewPageData(
          { role },
          { getDatabaseGeneralSummaryCounts }
        )
      ).resolves.toStrictEqual({
        isAllowed: true,
        counts,
      })
    }
  })
})

describe("renderDatabaseOverviewPage", () => {
  it("renders the existing access-denied UI for disallowed Collectors", () => {
    const markup = renderToStaticMarkup(
      renderDatabaseOverviewPage({ isAllowed: false })
    )

    expect(markup).toContain("Access denied")
  })

  it("renders the overview table for allowed Editors and Admins", () => {
    const markup = renderToStaticMarkup(
      renderDatabaseOverviewPage({
        isAllowed: true,
        counts: { ...counts },
      })
    )

    expect(markup).toContain("Database overview table")
  })
})
