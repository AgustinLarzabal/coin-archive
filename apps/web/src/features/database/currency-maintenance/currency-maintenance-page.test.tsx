import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { renderCurrencyMaintenancePage } from "./currency-maintenance-page"

vi.mock("@/components/access-denied", () => ({
  AccessDenied: () => "Access denied",
}))

vi.mock("./table-workflow/currencies-table", () => ({
  CurrenciesTable: () => "Currencies table",
}))

describe("renderCurrencyMaintenancePage", () => {
  it("renders the existing access-denied UI for disallowed Collectors", () => {
    const markup = renderToStaticMarkup(
      renderCurrencyMaintenancePage({ isAllowed: false })
    )

    expect(markup).toContain("Access denied")
  })

  it("renders the Currencies table for allowed Editors and Admins", () => {
    const markup = renderToStaticMarkup(
      renderCurrencyMaintenancePage({
        isAllowed: true,
        currencies: [
          {
            id: "a41f7966-a232-4f60-b052-a636b1d8a421",
            code: "argentine-peso",
            name: "Peso",
            fullName: "Argentine peso",
            createdAt: new Date("2026-06-24T12:00:00.000Z"),
            updatedAt: new Date("2026-06-24T12:00:00.000Z"),
          },
        ],
      })
    )

    expect(markup).toContain("Currencies table")
  })
})
