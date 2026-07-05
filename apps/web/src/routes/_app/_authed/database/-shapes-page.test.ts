import { renderToStaticMarkup } from "react-dom/server"
import type { ShapeOption } from "@workspace/db"
import { describe, expect, it, vi } from "vitest"

import { SHAPE_AUTHORIZATION_ERROR } from "@/lib/shape-maintenance"
import { loadShapeMaintenanceShapes, renderDatabaseShapesPage } from "./shapes"

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

describe("loadShapeMaintenanceShapes", () => {
  it("rejects unauthenticated access at the child-route boundary", async () => {
    const getShapes = vi.fn()

    await expect(
      loadShapeMaintenanceShapes(null, { getShapes })
    ).resolves.toStrictEqual({
      status: "error",
      formError: SHAPE_AUTHORIZATION_ERROR,
    })

    expect(getShapes).not.toHaveBeenCalled()
  })

  it("rejects signed-in Collectors without editor access", async () => {
    const getShapes = vi.fn()

    await expect(
      loadShapeMaintenanceShapes({ role: "collector" }, { getShapes })
    ).resolves.toStrictEqual({
      status: "error",
      formError: SHAPE_AUTHORIZATION_ERROR,
    })

    expect(getShapes).not.toHaveBeenCalled()
  })

  it("returns Shape records for Editors and Admins", async () => {
    const shapes = [
      createShape({
        id: "2f0b5ff0-f4a9-4333-8f6d-dad19cd8510b",
        code: "round",
        name: "Round",
      }),
    ]
    const getShapes = vi.fn().mockResolvedValue(shapes)
    const allowedRoles = ["editor", "admin"] as const

    for (const role of allowedRoles) {
      await expect(
        loadShapeMaintenanceShapes({ role }, { getShapes })
      ).resolves.toStrictEqual({
        status: "success",
        shapes,
      })
    }
  })
})

describe("renderDatabaseShapesPage", () => {
  it("renders the existing access-denied UI for disallowed Collectors", () => {
    const markup = renderToStaticMarkup(
      renderDatabaseShapesPage({ isAllowed: false })
    )

    expect(markup).toContain("Access denied")
  })

  it("renders the Shapes table for allowed Editors and Admins with maintenance actions", () => {
    const markup = renderToStaticMarkup(
      renderDatabaseShapesPage({
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
