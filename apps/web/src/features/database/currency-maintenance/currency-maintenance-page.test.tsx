import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { CurrencyMaintenanceRouteComponent } from "./currency-maintenance-page"

vi.mock("@/components/access-denied", () => ({
  AccessDenied: () => "Access denied",
}))

vi.mock("./table-workflow/currencies-table", () => ({
  CurrenciesTable: () => "Currencies table",
}))

describe("CurrencyMaintenanceRouteComponent", () => {
  it("renders the existing access-denied UI for disallowed Collectors", () => {
    const markup = renderToStaticMarkup(
      <CurrencyMaintenanceRouteComponent loaderData={{ isAllowed: false }} />
    )

    expect(markup).toContain("Access denied")
  })

  it("renders the Currencies table for allowed Editors and Admins", () => {
    const markup = renderToStaticMarkup(
      <CurrencyMaintenanceRouteComponent
        loaderData={{
          isAllowed: true,
          currencies: [
            {
              id: "a41f7966-a232-4f60-b052-a636b1d8a421",
              code: "argentine-peso",
              name: "Peso",
              fullName: "Argentine peso",
              createdAt: "2026-06-24T12:00:00.000Z",
              updatedAt: "2026-06-24T12:00:00.000Z",
              version: 1,
              etag: '"currency-version"',
            },
          ],
        }}
      />
    )

    expect(markup).toContain("Currencies table")
  })
})
