import type { MintOption } from "@coin-archive/db"
import { describe, expect, it, vi } from "vitest"
import { MINT_AUTHORIZATION_ERROR } from "./actions"
import { loadMintMaintenancePageData } from "./mint-maintenance-route-data"

vi.mock("@/components/access-denied", () => ({
  AccessDenied: () => "Access denied",
}))

vi.mock("./table-workflow/mints-table", () => ({
  MintsTable: ({ mints }: { mints: MintOption[] }) =>
    `Mints table: ${mints.map((mint) => mint.name).join(", ")}`,
}))

const mintTimestamps = {
  createdAt: new Date("2026-07-01T00:00:00.000Z"),
  updatedAt: new Date("2026-07-01T00:00:00.000Z"),
} as const

function createMint(
  overrides: Pick<MintOption, "id" | "code" | "name">
): MintOption {
  return {
    ...mintTimestamps,
    ...overrides,
  }
}

describe("loadMintMaintenancePageData", () => {
  it("rejects unauthenticated access at the child-route boundary", async () => {
    const getMints = vi.fn()

    await expect(
      loadMintMaintenancePageData(null, { getMints })
    ).resolves.toStrictEqual({
      status: "error",
      formError: MINT_AUTHORIZATION_ERROR,
    })

    expect(getMints).not.toHaveBeenCalled()
  })

  it("rejects signed-in Collectors without editor access", async () => {
    const getMints = vi.fn()

    await expect(
      loadMintMaintenancePageData({ role: "collector" }, { getMints })
    ).resolves.toStrictEqual({
      status: "error",
      formError: MINT_AUTHORIZATION_ERROR,
    })

    expect(getMints).not.toHaveBeenCalled()
  })

  it("returns Mint maintenance data for Editors and Admins", async () => {
    const mints = [
      createMint({
        id: "d2661fdc-5fd4-4d89-8bd6-1ca8d9b17b97",
        code: "buenos-aires-mint",
        name: "Buenos Aires Mint",
      }),
    ]
    const getMints = vi.fn().mockResolvedValue(mints)
    const allowedRoles = ["editor", "admin"] as const

    for (const role of allowedRoles) {
      await expect(
        loadMintMaintenancePageData({ role }, { getMints })
      ).resolves.toStrictEqual({
        status: "success",
        mints,
      })
    }
  })
})
