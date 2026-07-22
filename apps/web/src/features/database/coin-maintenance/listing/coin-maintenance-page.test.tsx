import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { COIN_MAINTENANCE_PAGE_SIZE } from "./coin-maintenance-page"
import {
  loadCoinMaintenancePageData,
  renderCoinMaintenancePage,
} from "./coin-maintenance-page"

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

describe("loadCoinMaintenancePageData", () => {
  it("rejects unauthenticated access at the child-route boundary", async () => {
    const getCoinMaintenanceList = vi.fn()
    const getIssuers = vi.fn()
    const getRulers = vi.fn()
    const getDistributions = vi.fn()
    const getCurrencies = vi.fn()
    const getCompositions = vi.fn()

    await expect(
      loadCoinMaintenancePageData(
        null,
        {
          page: 1,
        },
        {
          getCoinMaintenanceList,
          getIssuers,
          getRulers,
          getDistributions,
          getCurrencies,
          getCompositions,
        }
      )
    ).resolves.toStrictEqual({
      status: "error",
    })

    expect(getCoinMaintenanceList).not.toHaveBeenCalled()
    expect(getIssuers).not.toHaveBeenCalled()
  })

  it("rejects signed-in Collectors without editor access", async () => {
    const getCoinMaintenanceList = vi.fn()

    await expect(
      loadCoinMaintenancePageData(
        { role: "collector" },
        { page: 1 },
        {
          getCoinMaintenanceList,
          getIssuers: vi.fn(),
          getRulers: vi.fn(),
          getDistributions: vi.fn(),
          getCurrencies: vi.fn(),
          getCompositions: vi.fn(),
        }
      )
    ).resolves.toStrictEqual({
      status: "error",
    })

    expect(getCoinMaintenanceList).not.toHaveBeenCalled()
  })

  it("returns maintenance list data and filter options for Editors and Admins", async () => {
    const dependencies = {
      getCoinMaintenanceList: vi.fn().mockResolvedValue(list),
      getIssuers: vi.fn().mockResolvedValue(filterOptions.issuers),
      getRulers: vi.fn().mockResolvedValue(filterOptions.rulers),
      getDistributions: vi.fn().mockResolvedValue(filterOptions.distributions),
      getCurrencies: vi.fn().mockResolvedValue(filterOptions.currencies),
      getCompositions: vi.fn().mockResolvedValue(filterOptions.compositions),
    }

    for (const role of ["editor", "admin"] as const) {
      await expect(
        loadCoinMaintenancePageData(
          {
            role,
          },
          {
            titleQuery: "spanish",
            issuerCode: "spain",
            page: 2,
          },
          dependencies
        )
      ).resolves.toStrictEqual({
        status: "success",
        search: {
          title: "spanish",
          issuer: "spain",
          page: 2,
        },
        list,
        filterOptions,
      })
    }

    expect(dependencies.getCoinMaintenanceList).toHaveBeenCalledWith({
      titleQuery: "spanish",
      issuerCode: "spain",
      page: 2,
      pageSize: COIN_MAINTENANCE_PAGE_SIZE,
    })
  })
})

describe("renderCoinMaintenancePage", () => {
  it("renders the existing access-denied UI for disallowed Collectors", () => {
    const markup = renderToStaticMarkup(
      renderCoinMaintenancePage({ isAllowed: false })
    )

    expect(markup).toContain("Access denied")
  })

  it("renders the maintenance table for allowed Editors and Admins", () => {
    const markup = renderToStaticMarkup(
      renderCoinMaintenancePage({
        isAllowed: true,
        search: {
          title: "spanish",
          page: 1,
        },
        list,
        filterOptions,
      })
    )

    expect(markup).toContain("Coins maintenance table")
  })
})
