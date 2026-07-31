import type { RulerOption } from "@coin-archive/db"
import { describe, expect, it, vi } from "vitest"
import { RULER_AUTHORIZATION_ERROR } from "./actions"
import { loadRulerMaintenancePageData } from "./ruler-maintenance-route-data"

vi.mock("@/components/access-denied", () => ({
  AccessDenied: () => "Access denied",
}))

function createRuler(
  overrides: Pick<RulerOption, "id" | "code" | "name" | "group">
): RulerOption {
  return overrides
}

describe("loadRulerMaintenancePageData", () => {
  it("rejects unauthenticated access at the child-route boundary", async () => {
    const getRulers = vi.fn()
    const getRulerGroups = vi.fn()

    await expect(
      loadRulerMaintenancePageData(null, { getRulerGroups, getRulers })
    ).resolves.toStrictEqual({
      status: "error",
      formError: RULER_AUTHORIZATION_ERROR,
    })

    expect(getRulers).not.toHaveBeenCalled()
    expect(getRulerGroups).not.toHaveBeenCalled()
  })

  it("rejects signed-in Collectors without editor access", async () => {
    const getRulers = vi.fn()
    const getRulerGroups = vi.fn()

    await expect(
      loadRulerMaintenancePageData(
        { role: "collector" },
        { getRulerGroups, getRulers }
      )
    ).resolves.toStrictEqual({
      status: "error",
      formError: RULER_AUTHORIZATION_ERROR,
    })

    expect(getRulers).not.toHaveBeenCalled()
    expect(getRulerGroups).not.toHaveBeenCalled()
  })

  it("returns Ruler records for Editors and Admins", async () => {
    const rulers = [
      createRuler({
        id: "2f0b5ff0-f4a9-4333-8f6d-dad19cd8510b",
        code: "felipe-v",
        name: "Felipe V",
        group: {
          id: "6f18a1db-9096-433b-b3f1-906c772f7a29",
          code: "house-of-bourbon",
          name: "House of Bourbon",
        },
      }),
    ]
    const rulerGroups = [
      {
        id: "6f18a1db-9096-433b-b3f1-906c772f7a29",
        code: "house-of-bourbon",
        name: "House of Bourbon",
        createdAt: new Date("2026-07-01T00:00:00.000Z"),
        updatedAt: new Date("2026-07-01T00:00:00.000Z"),
      },
    ]
    const getRulerGroups = vi.fn().mockResolvedValue(rulerGroups)
    const getRulers = vi.fn().mockResolvedValue(rulers)
    const allowedRoles = ["editor", "admin"] as const

    for (const role of allowedRoles) {
      await expect(
        loadRulerMaintenancePageData({ role }, { getRulerGroups, getRulers })
      ).resolves.toStrictEqual({
        status: "success",
        rulers,
        rulerGroups,
      })
    }
  })
})
