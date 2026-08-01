import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { COIN_MAINTENANCE_PAGE_SIZE } from "./coin-maintenance-route-data"
import { CoinMaintenanceRouteComponent } from "./coin-maintenance-page"

vi.mock("@/components/access-denied", () => ({
  AccessDenied: () => "Access denied",
}))

vi.mock("./coins-maintenance-table", () => ({
  CoinsMaintenanceTable: () => "Coins maintenance table",
}))

const list = {
  items: [
    {
      id: "7d6dbe5f-a989-47eb-a82d-22879718ab5f",
      title: "Spanish Euro Test Coin",
      issuer: {
        code: "spain",
        name: "Spain",
      },
      minYear: 1999,
      maxYear: 2001,
      faceValue: {
        text: "1 Euro",
        currency: {
          code: "euro",
          name: "Euro",
        },
      },
      distribution: {
        code: "standard-circulation",
        name: "Standard circulation",
      },
      composition: {
        code: "silver-900",
        name: "Silver .900",
      },
      createdAt: new Date("2026-06-24T12:00:00.000Z"),
      updatedAt: new Date("2026-06-25T12:00:00.000Z"),
    },
  ],
  page: 1,
  pageSize: COIN_MAINTENANCE_PAGE_SIZE,
  totalItems: 1,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
}

const filterOptions = {
  issuers: [
    {
      id: "issuer-1",
      code: "spain",
      isoCode: "ES",
      name: "Spain",
    },
  ],
  rulers: [
    {
      id: "ruler-1",
      code: "charles-iii",
      name: "Charles III",
      group: null,
    },
  ],
  distributions: [
    {
      id: "distribution-1",
      code: "standard-circulation",
      name: "Standard circulation",
    },
  ],
  currencies: [
    {
      id: "currency-1",
      code: "euro",
      name: "Euro",
      fullName: "Euro",
      createdAt: new Date("2026-06-20T12:00:00.000Z"),
      updatedAt: new Date("2026-06-20T12:00:00.000Z"),
    },
  ],
  compositions: [
    {
      id: "composition-1",
      code: "silver-900",
      name: "Silver .900",
      description: null,
      createdAt: new Date("2026-06-20T12:00:00.000Z"),
      updatedAt: new Date("2026-06-20T12:00:00.000Z"),
    },
  ],
}

describe("CoinMaintenanceRouteComponent", () => {
  it("renders the existing access-denied UI for disallowed Collectors", () => {
    const markup = renderToStaticMarkup(
      <CoinMaintenanceRouteComponent loaderData={{ isAllowed: false }} />
    )

    expect(markup).toContain("Access denied")
  })

  it("renders the maintenance table for allowed Editors and Admins", () => {
    const markup = renderToStaticMarkup(
      <CoinMaintenanceRouteComponent
        loaderData={{
          isAllowed: true,
          search: {
            title: "spanish",
            page: 1,
          },
          list,
          filterOptions,
        }}
      />
    )

    expect(markup).toContain("Coins maintenance table")
  })
})
