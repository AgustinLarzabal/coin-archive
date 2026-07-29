import { renderToStaticMarkup } from "react-dom/server"
import type { EngraverOption } from "@coin-archive/db"
import { describe, expect, it, vi } from "vitest"

import { ENGRAVER_AUTHORIZATION_ERROR } from "./actions"

import {
  loadEngraverMaintenancePageData,
  renderEngraverMaintenancePage,
} from "./engraver-maintenance-page"

vi.mock("@/components/access-denied", () => ({
  AccessDenied: () => "Access denied",
}))

vi.mock("./table-workflow/engravers-table", () => ({
  EngraversTable: ({ engravers }: { engravers: EngraverOption[] }) =>
    `Engravers table: ${engravers.map((engraver) => engraver.name).join(", ")}`,
}))

describe("loadEngraverMaintenancePageData", () => {
  it("rejects unauthenticated access at the child-route boundary", async () => {
    const getEngravers = vi.fn()

    await expect(
      loadEngraverMaintenancePageData(null, { getEngravers })
    ).resolves.toStrictEqual({
      status: "error",
      formError: ENGRAVER_AUTHORIZATION_ERROR,
    })

    expect(getEngravers).not.toHaveBeenCalled()
  })

  it("rejects signed-in Collectors without editor access", async () => {
    const getEngravers = vi.fn()

    await expect(
      loadEngraverMaintenancePageData(
        { role: "collector" },
        { getEngravers }
      )
    ).resolves.toStrictEqual({
      status: "error",
      formError: ENGRAVER_AUTHORIZATION_ERROR,
    })

    expect(getEngravers).not.toHaveBeenCalled()
  })

  it("returns Engraver data for Editors and Admins", async () => {
    const engravers = [
      {
        id: "2816420d-cde4-4984-b5af-2aa4c5d2720d",
        code: "barth",
        name: "Barth",
      },
    ]
    const getEngravers = vi.fn().mockResolvedValue(engravers)

    await expect(
      loadEngraverMaintenancePageData({ role: "editor" }, { getEngravers })
    ).resolves.toStrictEqual({
      status: "success",
      engravers,
    })

    await expect(
      loadEngraverMaintenancePageData({ role: "admin" }, { getEngravers })
    ).resolves.toStrictEqual({
      status: "success",
      engravers,
    })
  })
})

describe("renderEngraverMaintenancePage", () => {
  it("renders the existing access-denied UI for disallowed Collectors", () => {
    const markup = renderToStaticMarkup(
      renderEngraverMaintenancePage({ isAllowed: false })
    )

    expect(markup).toContain("Access denied")
  })

  it("renders the Engraver maintenance table for allowed Editors and Admins", () => {
    const markup = renderToStaticMarkup(
      renderEngraverMaintenancePage({
        isAllowed: true,
        engravers: [
          {
            id: "2816420d-cde4-4984-b5af-2aa4c5d2720d",
            code: "barth",
            name: "Barth",
          },
        ],
      })
    )

    expect(markup).toContain("Engravers table:")
    expect(markup).toContain("Barth")
  })
})
