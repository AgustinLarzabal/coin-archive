import { renderToStaticMarkup } from "react-dom/server"
import type { RulerGroupOption, RulerOption } from "@workspace/db"
import { describe, expect, it, vi } from "vitest"

import { RULER_AUTHORIZATION_ERROR } from "@/lib/ruler-maintenance"
import { databaseSecondaryMenuItems } from "./-navigation-items"
import {
  loadRulerMaintenanceData,
  renderDatabaseRulersPage,
} from "./rulers"

vi.mock("@/components/access-denied", () => ({
  AccessDenied: () => "Access denied",
}))

function createRulerGroup(
  overrides: Pick<RulerGroupOption, "id" | "code" | "name">
): RulerGroupOption {
  return {
    createdAt: new Date("2026-07-01T00:00:00.000Z"),
    updatedAt: new Date("2026-07-01T00:00:00.000Z"),
    ...overrides,
  }
}

function createRuler(
  overrides: Pick<RulerOption, "id" | "code" | "name" | "group">
): RulerOption {
  return {
    ...overrides,
  }
}

describe("databaseSecondaryMenuItems", () => {
  it("includes the Rulers maintenance entry after Ruler Groups", () => {
    expect(databaseSecondaryMenuItems).toContainEqual({
      to: "/database/rulers",
      label: "Rulers",
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

describe("loadRulerMaintenanceData", () => {
  it("rejects unauthenticated access at the child-route boundary", async () => {
    const getRulerGroups = vi.fn()
    const getRulers = vi.fn()

    await expect(
      loadRulerMaintenanceData(null, { getRulerGroups, getRulers })
    ).resolves.toStrictEqual({
      status: "error",
      formError: RULER_AUTHORIZATION_ERROR,
    })

    expect(getRulerGroups).not.toHaveBeenCalled()
    expect(getRulers).not.toHaveBeenCalled()
  })

  it("rejects signed-in Collectors without editor access", async () => {
    const getRulerGroups = vi.fn()
    const getRulers = vi.fn()

    await expect(
      loadRulerMaintenanceData({ role: "collector" }, { getRulerGroups, getRulers })
    ).resolves.toStrictEqual({
      status: "error",
      formError: RULER_AUTHORIZATION_ERROR,
    })

    expect(getRulerGroups).not.toHaveBeenCalled()
    expect(getRulers).not.toHaveBeenCalled()
  })

  it("returns Ruler and Ruler Group records for Editors and Admins", async () => {
    const rulerGroups = [
      createRulerGroup({
        id: "2f0b5ff0-f4a9-4333-8f6d-dad19cd8510b",
        code: "house-of-bourbon",
        name: "House of Bourbon",
      }),
    ]
    const rulers = [
      createRuler({
        id: "49593601-9276-4761-a03b-f5e43cf674fd",
        code: "louis-xiv",
        name: "Louis XIV",
        group: {
          id: rulerGroups[0].id,
          code: rulerGroups[0].code,
          name: rulerGroups[0].name,
        },
      }),
    ]
    const getRulerGroups = vi.fn().mockResolvedValue(rulerGroups)
    const getRulers = vi.fn().mockResolvedValue(rulers)
    const allowedRoles = ["editor", "admin"] as const

    for (const role of allowedRoles) {
      await expect(
        loadRulerMaintenanceData({ role }, { getRulerGroups, getRulers })
      ).resolves.toStrictEqual({
        status: "success",
        rulerGroups,
        rulers,
      })
    }
  })
})

describe("renderDatabaseRulersPage", () => {
  it("renders the existing access-denied UI for disallowed Collectors", () => {
    const markup = renderToStaticMarkup(
      renderDatabaseRulersPage({ isAllowed: false })
    )

    expect(markup).toContain("Access denied")
  })

  it("renders the Rulers table for allowed Editors and Admins with maintenance actions", () => {
    const markup = renderToStaticMarkup(
      renderDatabaseRulersPage({
        isAllowed: true,
        rulerGroups: [
          createRulerGroup({
            id: "2f0b5ff0-f4a9-4333-8f6d-dad19cd8510b",
            code: "house-of-bourbon",
            name: "House of Bourbon",
          }),
        ],
        rulers: [
          createRuler({
            id: "49593601-9276-4761-a03b-f5e43cf674fd",
            code: "louis-xiv",
            name: "Louis XIV",
            group: {
              id: "2f0b5ff0-f4a9-4333-8f6d-dad19cd8510b",
              code: "house-of-bourbon",
              name: "House of Bourbon",
            },
          }),
          createRuler({
            id: "4c685de3-63fc-43eb-9a84-d6a228e4ad44",
            code: "liberty",
            name: "Liberty",
            group: null,
          }),
        ],
      })
    )

    expect(markup).toContain("Ruler Code")
    expect(markup).toContain("Ruler Name")
    expect(markup).toContain("Ruler Group")
    expect(markup).toContain("Louis XIV")
    expect(markup).toContain("House of Bourbon (house-of-bourbon)")
    expect(markup).toContain("Filter rulers by code, name, or ruler group...")
    expect(markup).toContain(">Create</button>")
    expect(markup).toContain('aria-label="Actions"')
  })
})
