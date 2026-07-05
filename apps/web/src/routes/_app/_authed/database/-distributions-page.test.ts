import { describe, expect, it, vi } from "vitest"

import { DISTRIBUTION_AUTHORIZATION_ERROR } from "@/lib/distribution-maintenance"

import { loadDistributionMaintenanceDistributions } from "./distributions"

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
