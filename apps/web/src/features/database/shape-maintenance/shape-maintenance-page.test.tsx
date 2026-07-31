import { renderToStaticMarkup } from "react-dom/server"
import type { ShapeOption } from "@coin-archive/db"
import { describe, expect, it, vi } from "vitest"
import { renderShapeMaintenancePage } from "./shape-maintenance-page"

vi.mock("@/components/access-denied", () => ({
  AccessDenied: () => "Access denied",
}))

const shapeTimestamps = {
  createdAt: new Date("2026-07-01T00:00:00.000Z"),
  updatedAt: new Date("2026-07-01T00:00:00.000Z"),
} as const

function createShape(
  overrides: Pick<ShapeOption, "id" | "code" | "name">
): ShapeOption {
  return {
    ...shapeTimestamps,
    ...overrides,
  }
}

describe("renderShapeMaintenancePage", () => {
  it("renders the existing access-denied UI for disallowed Collectors", () => {
    const markup = renderToStaticMarkup(
      renderShapeMaintenancePage({ isAllowed: false })
    )

    expect(markup).toContain("Access denied")
  })

  it("renders the Shapes table for allowed Editors and Admins with maintenance actions", () => {
    const markup = renderToStaticMarkup(
      renderShapeMaintenancePage({
        isAllowed: true,
        shapes: [
          createShape({
            id: "2f0b5ff0-f4a9-4333-8f6d-dad19cd8510b",
            code: "round",
            name: "Round",
          }),
          createShape({
            id: "0a6c3f74-230d-48ff-a2bd-986f9645d6f3",
            code: "scalloped",
            name: "Scalloped",
          }),
        ],
      })
    )

    expect(markup).toContain("Shape Code")
    expect(markup).toContain("Shape Name")
    expect(markup).toContain("Round")
    expect(markup).toContain("Scalloped")
    expect(markup).toContain("Filter shapes by code or name...")
    expect(markup).toContain(">Create</button>")
    expect(markup).toContain('aria-label="Actions"')
  })
})
