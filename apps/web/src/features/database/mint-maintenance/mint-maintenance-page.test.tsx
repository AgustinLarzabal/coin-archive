import { renderToStaticMarkup } from "react-dom/server"
import type { MintOption } from "@workspace/db"
import { describe, expect, it, vi } from "vitest"

import { MINT_AUTHORIZATION_ERROR } from "./actions"
import {
  loadMintMaintenancePageData,
  renderMintMaintenancePage,
} from "./mint-maintenance-page"

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

describe("renderMintMaintenancePage", () => {
  it("renders the existing access-denied UI for disallowed Collectors", () => {
    const markup = renderToStaticMarkup(
      renderMintMaintenancePage({ isAllowed: false })
    )

    expect(markup).toContain("Access denied")
  })

  it("renders the Mints maintenance table for allowed Editors and Admins", () => {
    const markup = renderToStaticMarkup(
      renderMintMaintenancePage({
        isAllowed: true,
        mints: [
          createMint({
            id: "d2661fdc-5fd4-4d89-8bd6-1ca8d9b17b97",
            code: "buenos-aires-mint",
            name: "Buenos Aires Mint",
          }),
          createMint({
            id: "2f7265fc-0ddf-49bc-b90a-71b3466ee3bd",
            code: "royal-mint-of-madrid",
            name: "Royal Mint of Madrid",
          }),
        ],
      })
    )

    expect(markup).toContain("Mints table:")
    expect(markup).toContain("Buenos Aires Mint")
    expect(markup).toContain("Royal Mint of Madrid")
  })
})
