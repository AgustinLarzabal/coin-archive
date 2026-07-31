import { describe, expect, it, vi } from "vitest"
import { CURRENCY_AUTHORIZATION_ERROR } from "./actions"
import { loadCurrencyMaintenanceCurrencies } from "./currency-maintenance-route-data"

vi.mock("@/components/access-denied", () => ({
  AccessDenied: () => "Access denied",
}))

vi.mock("./table-workflow/currencies-table", () => ({
  CurrenciesTable: () => "Currencies table",
}))

describe("loadCurrencyMaintenanceCurrencies", () => {
  it("rejects unauthenticated access at the child-route boundary", async () => {
    const getCurrencies = vi.fn()

    await expect(
      loadCurrencyMaintenanceCurrencies(null, { getCurrencies })
    ).resolves.toStrictEqual({
      status: "error",
      formError: CURRENCY_AUTHORIZATION_ERROR,
    })

    expect(getCurrencies).not.toHaveBeenCalled()
  })

  it("rejects signed-in Collectors without editor access", async () => {
    const getCurrencies = vi.fn()

    await expect(
      loadCurrencyMaintenanceCurrencies(
        { role: "collector" },
        { getCurrencies }
      )
    ).resolves.toStrictEqual({
      status: "error",
      formError: CURRENCY_AUTHORIZATION_ERROR,
    })

    expect(getCurrencies).not.toHaveBeenCalled()
  })

  it("returns currency data for Editors and Admins", async () => {
    const currencies = [
      {
        id: "a41f7966-a232-4f60-b052-a636b1d8a421",
        code: "argentine-peso",
        name: "Peso",
        fullName: "Argentine peso",
        createdAt: new Date("2026-06-24T12:00:00.000Z"),
        updatedAt: new Date("2026-06-24T12:00:00.000Z"),
      },
    ]
    const getCurrencies = vi.fn().mockResolvedValue(currencies)

    await expect(
      loadCurrencyMaintenanceCurrencies({ role: "editor" }, { getCurrencies })
    ).resolves.toStrictEqual({
      status: "success",
      currencies,
    })

    await expect(
      loadCurrencyMaintenanceCurrencies({ role: "admin" }, { getCurrencies })
    ).resolves.toStrictEqual({
      status: "success",
      currencies,
    })
  })
})
