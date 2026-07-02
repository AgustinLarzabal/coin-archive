import { renderToStaticMarkup } from "react-dom/server"
import type { RulerGroupOption } from "@workspace/db"
import { describe, expect, it, vi } from "vitest"

import { RULER_GROUP_AUTHORIZATION_ERROR } from "@/lib/ruler-group-maintenance"
import { databaseSecondaryMenuItems } from "./-navigation-items"
import {
  loadRulerGroupMaintenanceRulerGroups,
  renderDatabaseRulerGroupsPage,
} from "./ruler-groups"

vi.mock("@/components/access-denied", () => ({
  AccessDenied: () => "Access denied",
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

describe("databaseSecondaryMenuItems", () => {
  it("includes the Ruler Groups maintenance entry after Issuers and before Rulers", () => {
    expect(databaseSecondaryMenuItems).toContainEqual({
      to: "/database/ruler-groups",
      label: "Ruler Groups",
    })

    expect(databaseSecondaryMenuItems[9]).toStrictEqual({
      to: "/database/issuers",
      label: "Issuers",
    })
    expect(databaseSecondaryMenuItems[10]).toStrictEqual({
      to: "/database/ruler-groups",
      label: "Ruler Groups",
    })
    expect(databaseSecondaryMenuItems[11]).toStrictEqual({
      to: "/database/rulers",
      label: "Rulers",
    })
    expect(databaseSecondaryMenuItems[12]).toStrictEqual({
      to: "/database/orientations",
      label: "Orientations",
    })
  })
})

describe("loadRulerGroupMaintenanceRulerGroups", () => {
  it("rejects unauthenticated access at the child-route boundary", async () => {
    const getRulerGroups = vi.fn()

    await expect(
      loadRulerGroupMaintenanceRulerGroups(null, { getRulerGroups })
    ).resolves.toStrictEqual({
      status: "error",
      formError: RULER_GROUP_AUTHORIZATION_ERROR,
    })

    expect(getRulerGroups).not.toHaveBeenCalled()
  })

  it("rejects signed-in Collectors without editor access", async () => {
    const getRulerGroups = vi.fn()

    await expect(
      loadRulerGroupMaintenanceRulerGroups({ role: "collector" }, { getRulerGroups })
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
        loadRulerGroupMaintenanceRulerGroups({ role }, { getRulerGroups })
      ).resolves.toStrictEqual({
        status: "success",
        rulerGroups,
      })
    }
  })
})

describe("renderDatabaseRulerGroupsPage", () => {
  it("renders the existing access-denied UI for disallowed Collectors", () => {
    const markup = renderToStaticMarkup(
      renderDatabaseRulerGroupsPage({ isAllowed: false })
    )

    expect(markup).toContain("Access denied")
  })

  it("renders the Ruler Groups table for allowed Editors and Admins with maintenance actions", () => {
    const markup = renderToStaticMarkup(
      renderDatabaseRulerGroupsPage({
        isAllowed: true,
        rulerGroups: [
          createRulerGroup({
            id: "2f0b5ff0-f4a9-4333-8f6d-dad19cd8510b",
            code: "house-of-bourbon",
            name: "House of Bourbon",
          }),
          createRulerGroup({
            id: "0a6c3f74-230d-48ff-a2bd-986f9645d6f3",
            code: "julio-claudians",
            name: "Julio-Claudians",
          }),
        ],
      })
    )

    expect(markup).toContain("Ruler Group Code")
    expect(markup).toContain("Ruler Group Name")
    expect(markup).toContain("House of Bourbon")
    expect(markup).toContain("Julio-Claudians")
    expect(markup).toContain("Filter ruler groups by code or name...")
    expect(markup).toContain(">Create</button>")
    expect(markup).toContain('aria-label="Actions"')
  })
})
