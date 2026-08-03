import type { Mint } from "@coin-archive/api"
import { describe, expect, it, vi } from "vitest"

import { MINT_AUTHORIZATION_ERROR } from "./actions"
import { loadMintMaintenancePageData } from "./mint-maintenance-route-data"

const mints: Mint[] = [
  {
    id: "2c717ddb-95a2-4dad-a280-f58a4779aee8",
    code: "madrid",
    name: "Madrid",
    version: 1,
    createdAt: "2026-08-02T10:15:30.000Z",
    updatedAt: "2026-08-02T10:15:30.000Z",
    etag: '"mint-version-1"',
  },
  {
    id: "98474ec9-cb4c-44c3-b876-6b1790190dd5",
    code: "london",
    name: "London",
    version: 1,
    createdAt: "2026-08-02T10:15:30.000Z",
    updatedAt: "2026-08-02T10:15:30.000Z",
    etag: '"mint-version-1"',
  },
]

describe("loadMintMaintenancePageData", () => {
  it.each(["authentication_required", "editor_access_required"])(
    "maps API %s problems to the current access-denied presentation",
    async (code) => {
      const listMints = vi.fn().mockRejectedValue({
        data: { body: { code } },
      })

      await expect(
        loadMintMaintenancePageData({ listMints })
      ).resolves.toStrictEqual({
        status: "error",
        formError: MINT_AUTHORIZATION_ERROR,
      })
    }
  )

  it("loads every cursor page through the typed maintenance client", async () => {
    const listMints = vi
      .fn()
      .mockResolvedValueOnce({
        data: [mints[0]],
        nextCursor: "next",
      })
      .mockResolvedValueOnce({ data: [mints[1]], nextCursor: null })

    await expect(
      loadMintMaintenancePageData({ listMints })
    ).resolves.toStrictEqual({ status: "success", mints })
    expect(listMints).toHaveBeenNthCalledWith(1, {
      limit: 100,
      sort: "name",
      order: "asc",
    })
    expect(listMints).toHaveBeenNthCalledWith(2, {
      cursor: "next",
      limit: 100,
      sort: "name",
      order: "asc",
    })
  })

  it("does not hide unexpected API failures as authorization failures", async () => {
    const failure = new Error("API unavailable")

    await expect(
      loadMintMaintenancePageData({
        listMints: vi.fn().mockRejectedValue(failure),
      })
    ).rejects.toBe(failure)
  })
})
