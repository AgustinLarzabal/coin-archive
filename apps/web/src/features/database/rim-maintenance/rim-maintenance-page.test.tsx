import type { RimOption } from "@coin-archive/db"
import { describe, expect, it, vi } from "vitest"

import { RIM_AUTHORIZATION_ERROR } from "./actions"
import { loadRimMaintenanceRims } from "./rim-maintenance-page"

const rimTimestamps = {
  createdAt: new Date("2026-07-01T00:00:00.000Z"),
  updatedAt: new Date("2026-07-01T00:00:00.000Z"),
} as const

function createRim(overrides: Pick<RimOption, "id" | "code" | "name">): RimOption {
  return {
    ...rimTimestamps,
    ...overrides,
  }
}

describe("loadRimMaintenanceRims", () => {
  it("rejects unauthenticated access at the child-route boundary", async () => {
    const getRims = vi.fn()

    await expect(loadRimMaintenanceRims(null, { getRims })).resolves.toStrictEqual({
      status: "error",
      formError: RIM_AUTHORIZATION_ERROR,
    })

    expect(getRims).not.toHaveBeenCalled()
  })

  it("rejects signed-in Collectors without editor access", async () => {
    const getRims = vi.fn()

    await expect(
      loadRimMaintenanceRims({ role: "collector" }, { getRims })
    ).resolves.toStrictEqual({
      status: "error",
      formError: RIM_AUTHORIZATION_ERROR,
    })

    expect(getRims).not.toHaveBeenCalled()
  })

  it("returns Rim maintenance data for Editors and Admins", async () => {
    const rims = [
      createRim({
        id: "dff33645-e973-4fd5-a84d-bf5a773855ef",
        code: "raised",
        name: "Raised rim",
      }),
    ]
    const getRims = vi.fn().mockResolvedValue(rims)
    const allowedRoles = ["editor", "admin"] as const

    for (const role of allowedRoles) {
      await expect(
        loadRimMaintenanceRims({ role }, { getRims })
      ).resolves.toStrictEqual({
        status: "success",
        rims,
      })
    }
  })
})
