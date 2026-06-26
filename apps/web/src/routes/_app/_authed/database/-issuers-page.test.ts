import { describe, expect, it } from "vitest"

import { databaseSecondaryMenuItems } from "./-navigation-items"
import { loadIssuerMaintenanceAccess } from "./issuers"

describe("databaseSecondaryMenuItems", () => {
  it("includes the Issuers maintenance entry after Engravers", () => {
    expect(databaseSecondaryMenuItems).toContainEqual({
      to: "/database/issuers",
      label: "Issuers",
    })

    expect(databaseSecondaryMenuItems[6]).toStrictEqual({
      to: "/database/engravers",
      label: "Engravers",
    })
    expect(databaseSecondaryMenuItems[7]).toStrictEqual({
      to: "/database/issuers",
      label: "Issuers",
    })
  })
})

describe("loadIssuerMaintenanceAccess", () => {
  it("rejects unauthenticated access at the child-route boundary", async () => {
    await expect(loadIssuerMaintenanceAccess(null)).resolves.toStrictEqual({
      status: "error",
    })
  })

  it("rejects signed-in Collectors without editor access", async () => {
    await expect(
      loadIssuerMaintenanceAccess({ role: "collector" })
    ).resolves.toStrictEqual({
      status: "error",
    })
  })

  it("allows Editors and Admins", async () => {
    const allowedRoles = ["editor", "admin"] as const

    for (const role of allowedRoles) {
      await expect(loadIssuerMaintenanceAccess({ role })).resolves.toStrictEqual(
        {
          status: "success",
        }
      )
    }
  })
})
