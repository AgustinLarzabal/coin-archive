import { renderToStaticMarkup } from "react-dom/server"
import type { RulerOption } from "@workspace/db"
import { describe, expect, it, vi } from "vitest"

import { databaseSecondaryMenuItems } from "@/features/database/navigation"
import { RULER_AUTHORIZATION_ERROR } from "@/lib/ruler-maintenance"
import { loadRulerMaintenanceData, renderDatabaseRulersPage } from "./rulers"

vi.mock("@/components/access-denied", () => ({
  AccessDenied: () => "Access denied",
}))

function createRuler(
  overrides: Pick<RulerOption, "id" | "code" | "name" | "group">
): RulerOption {
  return overrides
}

describe("databaseSecondaryMenuItems", () => {
  it("includes the Rulers maintenance entry after Issuers and before Ruler Groups", () => {
    expect(databaseSecondaryMenuItems).toContainEqual({
      to: "/database/rulers",
      label: "Rulers",
    })

    expect(databaseSecondaryMenuItems[11]).toStrictEqual({
      to: "/database/issuers",
      label: "Issuers",
    })
    expect(databaseSecondaryMenuItems[12]).toStrictEqual({
      to: "/database/rulers",
      label: "Rulers",
    })
    expect(databaseSecondaryMenuItems[13]).toStrictEqual({
      to: "/database/ruler-groups",
      label: "Ruler Groups",
    })
  })
})

describe("loadRulerMaintenanceData", () => {
  it("rejects unauthenticated access at the child-route boundary", async () => {
    const getRulers = vi.fn()
    const getRulerGroups = vi.fn()

    await expect(
      loadRulerMaintenanceData(null, { getRulerGroups, getRulers })
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
      loadRulerMaintenanceData(
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
        loadRulerMaintenanceData({ role }, { getRulerGroups, getRulers })
      ).resolves.toStrictEqual({
        status: "success",
        rulers,
        rulerGroups,
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

  it("renders the Rulers table for allowed Editors and Admins with group details and maintenance actions", () => {
    const markup = renderToStaticMarkup(
      renderDatabaseRulersPage({
        isAllowed: true,
        rulerGroups: [
          {
            id: "6f18a1db-9096-433b-b3f1-906c772f7a29",
            code: "house-of-bourbon",
            name: "House of Bourbon",
            createdAt: new Date("2026-07-01T00:00:00.000Z"),
            updatedAt: new Date("2026-07-01T00:00:00.000Z"),
          },
        ],
        rulers: [
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
          createRuler({
            id: "0a6c3f74-230d-48ff-a2bd-986f9645d6f3",
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
    expect(markup).toContain("Felipe V")
    expect(markup).toContain("House of Bourbon (house-of-bourbon)")
    expect(markup).toContain("Liberty")
    expect(markup).toContain("No Ruler Group")
    expect(markup).toContain(
      "Filter rulers by code, name, or ruler group..."
    )
    expect(markup).toContain(">Create</button>")
    expect(markup).toContain('aria-label="Actions"')
  })
})
