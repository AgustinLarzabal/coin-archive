import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { renderCompositionMaintenancePage } from "./composition-maintenance-page"

vi.mock("@/components/access-denied", () => ({
  AccessDenied: () => "Access denied",
}))

vi.mock("./table-workflow/compositions-table", () => ({
  CompositionsTable: () => "Compositions table",
}))

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
            createdAt: new Date("2026-06-24T12:00:00.000Z"),
            updatedAt: new Date("2026-06-24T12:00:00.000Z"),
          },
        ],
      })
    )

    expect(markup).toContain("Compositions table")
  })
})
