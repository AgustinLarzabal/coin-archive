import { describe, expect, it, vi } from "vitest"

import { databaseSecondaryMenuItems } from "@/features/database/navigation"
import { COMPOSITION_AUTHORIZATION_ERROR } from "@/lib/composition-maintenance"

import { loadCompositionMaintenanceCompositions } from "./compositions"

describe("databaseSecondaryMenuItems", () => {
  it("includes the read-only Compositions page in the database secondary menu", () => {
    expect(databaseSecondaryMenuItems).toContainEqual({
      to: "/database/compositions",
      label: "Compositions",
    })
  })
})

describe("loadCompositionMaintenanceCompositions", () => {
  it("rejects unauthenticated access at the child-route boundary", async () => {
    const getCompositions = vi.fn()

    await expect(
      loadCompositionMaintenanceCompositions(null, { getCompositions })
    ).resolves.toStrictEqual({
      status: "error",
      formError: COMPOSITION_AUTHORIZATION_ERROR,
    })

    expect(getCompositions).not.toHaveBeenCalled()
  })

  it("rejects signed-in Collectors without editor access", async () => {
    const getCompositions = vi.fn()

    await expect(
      loadCompositionMaintenanceCompositions(
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
      loadCompositionMaintenanceCompositions(
        { role: "editor" },
        { getCompositions }
      )
    ).resolves.toStrictEqual({
      status: "success",
      compositions,
    })

    await expect(
      loadCompositionMaintenanceCompositions(
        { role: "admin" },
        { getCompositions }
      )
    ).resolves.toStrictEqual({
      status: "success",
      compositions,
    })
  })
})
