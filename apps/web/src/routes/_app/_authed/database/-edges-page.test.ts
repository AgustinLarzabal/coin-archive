import { describe, expect, it, vi } from "vitest"

import { EDGE_AUTHORIZATION_ERROR } from "@/lib/edge-maintenance"
import { databaseSecondaryMenuItems } from "./-navigation-items"

import { loadEdgeMaintenanceEdges } from "./edges"

describe("databaseSecondaryMenuItems", () => {
  it("includes the Edges page in the database secondary menu after Distributions", () => {
    expect(databaseSecondaryMenuItems).toContainEqual({
      to: "/database/edges",
      label: "Edges",
    })

    expect(databaseSecondaryMenuItems[4]).toStrictEqual({
      to: "/database/distributions",
      label: "Distributions",
    })
    expect(databaseSecondaryMenuItems[5]).toStrictEqual({
      to: "/database/edges",
      label: "Edges",
    })
  })
})

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
