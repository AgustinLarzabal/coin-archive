import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { EDGE_AUTHORIZATION_ERROR } from "./actions"

import { loadEdgeMaintenanceEdges, renderEdgeMaintenancePage } from "./edge-maintenance-page"

vi.mock("@/components/access-denied", () => ({
  AccessDenied: () => "Access denied",
}))

describe("loadEdgeMaintenanceEdges", () => {
  it("rejects unauthenticated access at the child-route boundary", async () => {
    const getEdges = vi.fn()

    await expect(
      loadEdgeMaintenanceEdges(null, { getEdges })
    ).resolves.toStrictEqual({
      status: "error",
      formError: EDGE_AUTHORIZATION_ERROR,
    })

    expect(getEdges).not.toHaveBeenCalled()
  })

  it("rejects signed-in Collectors without editor access", async () => {
    const getEdges = vi.fn()

    await expect(
      loadEdgeMaintenanceEdges({ role: "collector" }, { getEdges })
    ).resolves.toStrictEqual({
      status: "error",
      formError: EDGE_AUTHORIZATION_ERROR,
    })

    expect(getEdges).not.toHaveBeenCalled()
  })

  it("returns Edge data for Editors and Admins", async () => {
    const edges = [
      {
        id: "eb80363e-d0dc-4a28-8a43-297fbd5d67fc",
        code: "reeded",
        name: "Reeded",
        createdAt: new Date("2026-06-24T12:00:00.000Z"),
        updatedAt: new Date("2026-06-24T12:00:00.000Z"),
      },
    ]
    const getEdges = vi.fn().mockResolvedValue(edges)

    await expect(
      loadEdgeMaintenanceEdges({ role: "editor" }, { getEdges })
    ).resolves.toStrictEqual({
      status: "success",
      edges,
    })

    await expect(
      loadEdgeMaintenanceEdges({ role: "admin" }, { getEdges })
    ).resolves.toStrictEqual({
      status: "success",
      edges,
    })
  })
})

describe("renderEdgeMaintenancePage", () => {
  it("renders the existing access-denied UI for disallowed Collectors", () => {
    const markup = renderToStaticMarkup(renderEdgeMaintenancePage({ isAllowed: false }))

    expect(markup).toContain("Access denied")
  })

  it("renders the Edges table for allowed Editors and Admins", () => {
    const markup = renderToStaticMarkup(
      renderEdgeMaintenancePage({
        isAllowed: true,
        edges: [
          {
            id: "eb80363e-d0dc-4a28-8a43-297fbd5d67fc",
            code: "reeded",
            name: "Reeded",
            createdAt: new Date("2026-06-24T12:00:00.000Z"),
            updatedAt: new Date("2026-06-24T12:00:00.000Z"),
          },
        ],
      })
    )

    expect(markup).toContain("Edge Code")
    expect(markup).toContain("Edge Name")
    expect(markup).toContain("Reeded")
  })
})
