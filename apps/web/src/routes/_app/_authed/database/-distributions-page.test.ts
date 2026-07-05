import { describe, expect, it, vi } from "vitest"

import { databaseSecondaryMenuItems } from "@/features/database/navigation"
import { DISTRIBUTION_AUTHORIZATION_ERROR } from "@/lib/distribution-maintenance"

import { loadDistributionMaintenanceDistributions } from "./distributions"

describe("databaseSecondaryMenuItems", () => {
  it("includes the read-only Distributions page in the database secondary menu after Currencies", () => {
    expect(databaseSecondaryMenuItems).toContainEqual({
      to: "/database/distributions",
      label: "Distributions",
    })

    expect(databaseSecondaryMenuItems.indexOf(databaseSecondaryMenuItems[3])).toBe(
      3
    )
    expect(databaseSecondaryMenuItems[3]).toStrictEqual({
      to: "/database/currencies",
      label: "Currencies",
    })
    expect(databaseSecondaryMenuItems[4]).toStrictEqual({
      to: "/database/distributions",
      label: "Distributions",
    })
  })
})

describe("loadDistributionMaintenanceDistributions", () => {
  it("rejects unauthenticated access at the child-route boundary", async () => {
    const getDistributions = vi.fn()

    await expect(
      loadDistributionMaintenanceDistributions(null, { getDistributions })
    ).resolves.toStrictEqual({
      status: "error",
      formError: DISTRIBUTION_AUTHORIZATION_ERROR,
    })

    expect(getDistributions).not.toHaveBeenCalled()
  })

  it("rejects signed-in Collectors without editor access", async () => {
    const getDistributions = vi.fn()

    await expect(
      loadDistributionMaintenanceDistributions(
        { role: "collector" },
        { getDistributions }
      )
    ).resolves.toStrictEqual({
      status: "error",
      formError: DISTRIBUTION_AUTHORIZATION_ERROR,
    })

    expect(getDistributions).not.toHaveBeenCalled()
  })

  it("returns Distribution data for Editors and Admins", async () => {
    const distributions = [
      {
        id: "84863d38-795b-443c-bd27-1dedb73c0fad",
        code: "standard-circulation",
        name: "Standard circulation",
      },
    ]
    const getDistributions = vi.fn().mockResolvedValue(distributions)

    await expect(
      loadDistributionMaintenanceDistributions(
        { role: "editor" },
        { getDistributions }
      )
    ).resolves.toStrictEqual({
      status: "success",
      distributions,
    })

    await expect(
      loadDistributionMaintenanceDistributions(
        { role: "admin" },
        { getDistributions }
      )
    ).resolves.toStrictEqual({
      status: "success",
      distributions,
    })
  })
})
