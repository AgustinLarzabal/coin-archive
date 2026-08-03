import { describe, expect, it, vi } from "vitest"
import {
  COIN_MAINTENANCE_PAGE_SIZE,
  loadCoinMaintenancePageData,
} from "./coin-maintenance-route-data"

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

const apiItems = list.items.map((item) => ({
  ...item,
  issuer: { id: "issuer-1", ...item.issuer },
  faceValue: {
    ...item.faceValue,
    currency: { id: "currency-1", ...item.faceValue.currency },
  },
  distribution: { id: "distribution-1", ...item.distribution },
  composition: { id: "composition-1", ...item.composition },
  createdAt: item.createdAt.toISOString(),
  updatedAt: item.updatedAt.toISOString(),
}))

describe("loadCoinMaintenancePageData", () => {
  it("rejects unauthenticated access at the child-route boundary", async () => {
    const listCoins = vi.fn()
    const getOptions = vi.fn()

    await expect(
      loadCoinMaintenancePageData(
        null,
        {
          page: 1,
        },
        {
          listCoins,
          getOptions,
        }
      )
    ).resolves.toStrictEqual({
      status: "error",
    })

    expect(listCoins).not.toHaveBeenCalled()
    expect(getOptions).not.toHaveBeenCalled()
  })

  it("rejects signed-in Collectors without editor access", async () => {
    const listCoins = vi.fn()

    await expect(
      loadCoinMaintenancePageData(
        { role: "collector" },
        { page: 1 },
        {
          listCoins,
          getOptions: vi.fn(),
        }
      )
    ).resolves.toStrictEqual({
      status: "error",
    })

    expect(listCoins).not.toHaveBeenCalled()
  })

  it("returns maintenance list data and filter options for Editors and Admins", async () => {
    const dependencies = {
      listCoins: vi
        .fn()
        .mockResolvedValue({ data: apiItems, nextCursor: null }),
      getOptions: vi.fn().mockResolvedValue({ data: filterOptions }),
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
        list: {
          ...list,
          items: [],
          page: 2,
          hasPreviousPage: true,
        },
        filterOptions,
      })
    }

    expect(dependencies.listCoins).toHaveBeenCalledWith({
      q: "spanish",
      issuer: "spain",
      ruler: undefined,
      distribution: undefined,
      currency: undefined,
      composition: undefined,
      limit: 100,
      sort: "updatedAt",
      order: "desc",
    })
  })
})
