import { renderToStaticMarkup } from "react-dom/server"
import type { OrientationOption } from "@coin-archive/db"
import { describe, expect, it, vi } from "vitest"
import { renderOrientationMaintenancePage } from "./orientation-maintenance-page"

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
