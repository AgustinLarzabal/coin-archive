import type { Theme } from "@coin-archive/api"
import { describe, expect, it, vi } from "vitest"

import { THEME_AUTHORIZATION_ERROR } from "./actions"
import { loadThemeMaintenancePageData } from "./theme-maintenance-route-data"

const themes: Theme[] = [
  {
    id: "2c717ddb-95a2-4dad-a280-f58a4779aee8",
    code: "reeded",
    name: "Reeded",
    version: 1,
    createdAt: "2026-08-02T10:15:30.000Z",
    updatedAt: "2026-08-02T10:15:30.000Z",
    etag: '"theme-version-1"',
  },
  {
    id: "98474ec9-cb4c-44c3-b876-6b1790190dd5",
    code: "plain",
    name: "Plain",
    version: 1,
    createdAt: "2026-08-02T10:15:30.000Z",
    updatedAt: "2026-08-02T10:15:30.000Z",
    etag: '"theme-version-1"',
  },
]

describe("loadThemeMaintenancePageData", () => {
  it.each(["authentication_required", "editor_access_required"])(
    "maps API %s problems to the current access-denied presentation",
    async (code) => {
      const listThemes = vi.fn().mockRejectedValue({
        data: { body: { code } },
      })

      await expect(
        loadThemeMaintenancePageData({ listThemes })
      ).resolves.toStrictEqual({
        status: "error",
        formError: THEME_AUTHORIZATION_ERROR,
      })
    }
  )

  it("loads every cursor page through the typed maintenance client", async () => {
    const listThemes = vi
      .fn()
      .mockResolvedValueOnce({ data: [themes[0]], nextCursor: "next" })
      .mockResolvedValueOnce({ data: [themes[1]], nextCursor: null })

    await expect(
      loadThemeMaintenancePageData({ listThemes })
    ).resolves.toStrictEqual({ status: "success", themes })
    expect(listThemes).toHaveBeenNthCalledWith(1, {
      limit: 100,
      sort: "name",
      order: "asc",
    })
    expect(listThemes).toHaveBeenNthCalledWith(2, {
      cursor: "next",
      limit: 100,
      sort: "name",
      order: "asc",
    })
  })

  it("does not hide unexpected API failures as authorization failures", async () => {
    const failure = new Error("API unavailable")

    await expect(
      loadThemeMaintenancePageData({
        listThemes: vi.fn().mockRejectedValue(failure),
      })
    ).rejects.toBe(failure)
  })
})
