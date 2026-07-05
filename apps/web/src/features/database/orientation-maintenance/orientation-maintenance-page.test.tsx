import { renderToStaticMarkup } from "react-dom/server"
import type { OrientationOption } from "@workspace/db"
import { describe, expect, it, vi } from "vitest"

import { ORIENTATION_AUTHORIZATION_ERROR } from "./actions"
import {
  loadOrientationMaintenanceOrientations,
  renderOrientationMaintenancePage,
} from "./orientation-maintenance-page"

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

describe("renderOrientationMaintenancePage", () => {
  it("renders the existing access-denied UI for disallowed Collectors", () => {
    const markup = renderToStaticMarkup(
      renderOrientationMaintenancePage({ isAllowed: false })
    )

    expect(markup).toContain("Access denied")
  })

  it("renders the Orientations maintenance table for allowed Editors and Admins", () => {
    const markup = renderToStaticMarkup(
      renderOrientationMaintenancePage({
        isAllowed: true,
        orientations: [
          createOrientation({
            id: "645c07ac-cfbb-4a29-b056-9680634c6c2c",
            code: "coin-alignment",
            name: "Coin alignment",
          }),
          createOrientation({
            id: "9c65c9ed-eb9d-4cf5-986f-1346d6a326ca",
            code: "medal-alignment",
            name: "Medal alignment",
          }),
        ],
      })
    )

    expect(markup).toContain("Orientation Code")
    expect(markup).toContain("Orientation Name")
    expect(markup).toContain("Coin alignment")
    expect(markup).toContain("Medal alignment")
    expect(markup).toContain("Create")
    expect(markup).toContain('aria-label="Actions"')
  })
})
