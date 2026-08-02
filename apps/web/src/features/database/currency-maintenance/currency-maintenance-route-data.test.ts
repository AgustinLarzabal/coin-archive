import type { Currency } from "@coin-archive/api"
import { describe, expect, it, vi } from "vitest"

import { CURRENCY_AUTHORIZATION_ERROR } from "./actions"
import { loadCurrencyMaintenancePageData } from "./currency-maintenance-route-data"

const currencies: Currency[] = [
  {
    id: "2c717ddb-95a2-4dad-a280-f58a4779aee8",
    code: "silver",
    name: "Silver",
    fullName: "Silver",
    version: 1,
    createdAt: "2026-08-02T10:15:30.000Z",
    updatedAt: "2026-08-02T10:15:30.000Z",
    etag: '"currency-version-1"',
  },
  {
    id: "98474ec9-cb4c-44c3-b876-6b1790190dd5",
    code: "gold",
    name: "Gold",
    fullName: "Gold",
    version: 1,
    createdAt: "2026-08-02T10:15:30.000Z",
    updatedAt: "2026-08-02T10:15:30.000Z",
    etag: '"currency-version-1"',
  },
]

describe("loadCurrencyMaintenancePageData", () => {
  it.each(["UNAUTHORIZED", "FORBIDDEN"])(
    "maps API %s problems to the current access-denied presentation",
    async (code) => {
      const listCurrencies = vi.fn().mockRejectedValue({ code })

      await expect(
        loadCurrencyMaintenancePageData({ listCurrencies })
      ).resolves.toStrictEqual({
        status: "error",
        formError: CURRENCY_AUTHORIZATION_ERROR,
      })
    }
  )

  it("loads every cursor page through the typed maintenance client", async () => {
    const listCurrencies = vi
      .fn()
      .mockResolvedValueOnce({ data: [currencies[0]], nextCursor: "next" })
      .mockResolvedValueOnce({ data: [currencies[1]], nextCursor: null })

    await expect(
      loadCurrencyMaintenancePageData({ listCurrencies })
    ).resolves.toStrictEqual({ status: "success", currencies })
    expect(listCurrencies).toHaveBeenNthCalledWith(1, {
      limit: 100,
      sort: "name",
      order: "asc",
    })
    expect(listCurrencies).toHaveBeenNthCalledWith(2, {
      cursor: "next",
      limit: 100,
      sort: "name",
      order: "asc",
    })
  })

  it("does not hide unexpected API failures as authorization failures", async () => {
    const failure = new Error("API unavailable")

    await expect(
      loadCurrencyMaintenancePageData({
        listCurrencies: vi.fn().mockRejectedValue(failure),
      })
    ).rejects.toBe(failure)
  })
})
