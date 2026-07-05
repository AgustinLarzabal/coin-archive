import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { COMPOSITION_AUTHORIZATION_ERROR } from "./messages"
import {
  loadCompositionMaintenancePageData,
  renderCompositionMaintenancePage,
} from "./composition-maintenance-page"

vi.mock("@/components/access-denied", () => ({
  AccessDenied: () => "Access denied",
}))

vi.mock("./table-workflow/compositions-table", () => ({
  CompositionsTable: () => "Compositions table",
}))

describe("loadCompositionMaintenancePageData", () => {
  it("rejects unauthenticated access at the child-route boundary", async () => {
    const getCompositions = vi.fn()

    await expect(
      loadCompositionMaintenancePageData(null, { getCompositions })
    ).resolves.toStrictEqual({
      status: "error",
      formError: COMPOSITION_AUTHORIZATION_ERROR,
    })

    expect(getCompositions).not.toHaveBeenCalled()
  })

  it("rejects signed-in Collectors without editor access", async () => {
    const getCompositions = vi.fn()

    await expect(
      loadCompositionMaintenancePageData(
        { role: "collector" },
        { getCompositions }
      )
    ).resolves.toStrictEqual({
      status: "error",
      formError: COMPOSITION_AUTHORIZATION_ERROR,
    })

    expect(getCompositions).not.toHaveBeenCalled()
  })

  it("returns composition data for Editors and Admins", async () => {
    const compositions = [
      {
        id: "c3e497b8-fda5-48d6-a8c3-f37bc1c8f2a6",
        code: "silver-900",
        name: "Silver (.900)",
        description: "Ninety percent silver alloy.",
        createdAt: new Date("2026-06-24T12:00:00.000Z"),
        updatedAt: new Date("2026-06-24T12:00:00.000Z"),
      },
    ]
    const getCompositions = vi.fn().mockResolvedValue(compositions)

    await expect(
      loadCompositionMaintenancePageData(
        { role: "editor" },
        { getCompositions }
      )
    ).resolves.toStrictEqual({
      status: "success",
      compositions,
    })

    await expect(
      loadCompositionMaintenancePageData({ role: "admin" }, { getCompositions })
    ).resolves.toStrictEqual({
      status: "success",
      compositions,
    })
  })
})

describe("renderCompositionMaintenancePage", () => {
  it("renders the existing access-denied UI for disallowed Collectors", () => {
    const markup = renderToStaticMarkup(
      renderCompositionMaintenancePage({ isAllowed: false })
    )

    expect(markup).toContain("Access denied")
  })

  it("renders the Compositions table for allowed Editors and Admins", () => {
    const markup = renderToStaticMarkup(
      renderCompositionMaintenancePage({
        isAllowed: true,
        compositions: [
          {
            id: "c3e497b8-fda5-48d6-a8c3-f37bc1c8f2a6",
            code: "silver-900",
            name: "Silver (.900)",
            description: "Ninety percent silver alloy.",
            createdAt: new Date("2026-06-24T12:00:00.000Z"),
            updatedAt: new Date("2026-06-24T12:00:00.000Z"),
          },
        ],
      })
    )

    expect(markup).toContain("Compositions table")
  })
})
