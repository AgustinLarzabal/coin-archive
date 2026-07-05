import { describe, expect, it, vi } from "vitest"

import { databaseSecondaryMenuItems } from "@/features/database/navigation"
import { CURRENCY_AUTHORIZATION_ERROR } from "@/lib/currency-maintenance"

import { loadCurrencyMaintenanceCurrencies } from "./currencies"

describe("databaseSecondaryMenuItems", () => {
  it("includes the read-only Currencies page in the database secondary menu", () => {
    expect(databaseSecondaryMenuItems).toContainEqual({
      to: "/database/currencies",
      label: "Currencies",
    })
  })
})

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
