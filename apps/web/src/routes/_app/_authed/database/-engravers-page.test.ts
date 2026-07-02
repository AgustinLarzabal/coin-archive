import { describe, expect, it, vi } from "vitest"

import { ENGRAVER_AUTHORIZATION_ERROR } from "@/lib/engraver-maintenance"
import { databaseSecondaryMenuItems } from "./-navigation-items"

import { loadEngraverMaintenanceEngravers } from "./engravers"

describe("databaseSecondaryMenuItems", () => {
  it("includes the read-only Engravers page in the database secondary menu after Minting Techniques", () => {
    expect(databaseSecondaryMenuItems).toContainEqual({
      to: "/database/engravers",
      label: "Engravers",
    })

    expect(databaseSecondaryMenuItems[7]).toStrictEqual({
      to: "/database/shapes",
      label: "Shapes",
    })
    expect(databaseSecondaryMenuItems[8]).toStrictEqual({
      to: "/database/minting-techniques",
      label: "Minting Techniques",
    })
    expect(databaseSecondaryMenuItems[9]).toStrictEqual({
      to: "/database/engravers",
      label: "Engravers",
    })
  })
})

describe("loadEngraverMaintenanceEngravers", () => {
  it("rejects unauthenticated access at the child-route boundary", async () => {
    const getEngravers = vi.fn()

    await expect(
      loadEngraverMaintenanceEngravers(null, { getEngravers })
    ).resolves.toStrictEqual({
      status: "error",
      formError: ENGRAVER_AUTHORIZATION_ERROR,
    })

    expect(getEngravers).not.toHaveBeenCalled()
  })

  it("rejects signed-in Collectors without editor access", async () => {
    const getEngravers = vi.fn()

    await expect(
      loadEngraverMaintenanceEngravers(
        { role: "collector" },
        { getEngravers }
      )
    ).resolves.toStrictEqual({
      status: "error",
      formError: ENGRAVER_AUTHORIZATION_ERROR,
    })

    expect(getEngravers).not.toHaveBeenCalled()
  })

  it("returns Engraver data for Editors and Admins", async () => {
    const engravers = [
      {
        id: "2816420d-cde4-4984-b5af-2aa4c5d2720d",
        code: "barth",
        name: "Barth",
      },
    ]
    const getEngravers = vi.fn().mockResolvedValue(engravers)

    await expect(
      loadEngraverMaintenanceEngravers({ role: "editor" }, { getEngravers })
    ).resolves.toStrictEqual({
      status: "success",
      engravers,
    })

    await expect(
      loadEngraverMaintenanceEngravers({ role: "admin" }, { getEngravers })
    ).resolves.toStrictEqual({
      status: "success",
      engravers,
    })
  })
})
