import type { RulerGroupOption } from "@coin-archive/db"
import { describe, expect, it, vi } from "vitest"
import { RULER_GROUP_AUTHORIZATION_ERROR } from "./actions"
import { loadRulerGroupMaintenancePageData } from "./ruler-group-maintenance-route-data"

vi.mock("@/components/access-denied", () => ({
  AccessDenied: () => "Access denied",
}))

vi.mock("./table-workflow/ruler-groups-table", () => ({
  RulerGroupsTable: ({ rulerGroups }: { rulerGroups: RulerGroupOption[] }) =>
    `Ruler groups table: ${rulerGroups.map((group) => group.name).join(", ")}`,
}))

const rulerGroupTimestamps = {
  createdAt: new Date("2026-07-01T00:00:00.000Z"),
  updatedAt: new Date("2026-07-01T00:00:00.000Z"),
} as const

function createRulerGroup(
  overrides: Pick<RulerGroupOption, "id" | "code" | "name">
): RulerGroupOption {
  return {
    ...rulerGroupTimestamps,
    ...overrides,
  }
}

describe("loadRulerGroupMaintenancePageData", () => {
  it("rejects unauthenticated access at the child-route boundary", async () => {
    const getRulerGroups = vi.fn()

    await expect(
      loadRulerGroupMaintenancePageData(null, { getRulerGroups })
    ).resolves.toStrictEqual({
      status: "error",
      formError: RULER_GROUP_AUTHORIZATION_ERROR,
    })

    expect(getRulerGroups).not.toHaveBeenCalled()
  })

  it("rejects signed-in Collectors without editor access", async () => {
    const getRulerGroups = vi.fn()

    await expect(
      loadRulerGroupMaintenancePageData(
        { role: "collector" },
        { getRulerGroups }
      )
    ).resolves.toStrictEqual({
      status: "error",
      formError: RULER_GROUP_AUTHORIZATION_ERROR,
    })

    expect(getRulerGroups).not.toHaveBeenCalled()
  })

  it("returns Ruler Group records for Editors and Admins", async () => {
    const rulerGroups = [
      createRulerGroup({
        id: "2f0b5ff0-f4a9-4333-8f6d-dad19cd8510b",
        code: "house-of-bourbon",
        name: "House of Bourbon",
      }),
    ]
    const getRulerGroups = vi.fn().mockResolvedValue(rulerGroups)
    const allowedRoles = ["editor", "admin"] as const

    for (const role of allowedRoles) {
      await expect(
        loadRulerGroupMaintenancePageData({ role }, { getRulerGroups })
      ).resolves.toStrictEqual({
        status: "success",
        rulerGroups,
      })
    }
  })
})
