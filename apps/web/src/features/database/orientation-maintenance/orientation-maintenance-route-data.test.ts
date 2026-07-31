import type { OrientationOption } from "@coin-archive/db"
import { describe, expect, it, vi } from "vitest"
import { ORIENTATION_AUTHORIZATION_ERROR } from "./actions"
import { loadOrientationMaintenanceOrientations } from "./orientation-maintenance-route-data"

vi.mock("@/components/access-denied", () => ({
  AccessDenied: () => "Access denied",
}))

const orientationTimestamps = {
  createdAt: new Date("2026-07-01T00:00:00.000Z"),
  updatedAt: new Date("2026-07-01T00:00:00.000Z"),
} as const

function createOrientation(
  overrides: Pick<OrientationOption, "id" | "code" | "name">
): OrientationOption {
  return {
    ...orientationTimestamps,
    ...overrides,
  }
}

describe("loadOrientationMaintenanceOrientations", () => {
  it("rejects unauthenticated access at the child-route boundary", async () => {
    const getOrientations = vi.fn()

    await expect(
      loadOrientationMaintenanceOrientations(null, { getOrientations })
    ).resolves.toStrictEqual({
      status: "error",
      formError: ORIENTATION_AUTHORIZATION_ERROR,
    })

    expect(getOrientations).not.toHaveBeenCalled()
  })

  it("rejects signed-in Collectors without editor access", async () => {
    const getOrientations = vi.fn()

    await expect(
      loadOrientationMaintenanceOrientations(
        { role: "collector" },
        { getOrientations }
      )
    ).resolves.toStrictEqual({
      status: "error",
      formError: ORIENTATION_AUTHORIZATION_ERROR,
    })

    expect(getOrientations).not.toHaveBeenCalled()
  })

  it("returns Orientation maintenance data for Editors and Admins", async () => {
    const orientations = [
      createOrientation({
        id: "645c07ac-cfbb-4a29-b056-9680634c6c2c",
        code: "coin-alignment",
        name: "Coin alignment",
      }),
    ]
    const getOrientations = vi.fn().mockResolvedValue(orientations)
    const allowedRoles = ["editor", "admin"] as const

    for (const role of allowedRoles) {
      await expect(
        loadOrientationMaintenanceOrientations({ role }, { getOrientations })
      ).resolves.toStrictEqual({
        status: "success",
        orientations,
      })
    }
  })
})
