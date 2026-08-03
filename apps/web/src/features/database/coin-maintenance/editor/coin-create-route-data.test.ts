import { describe, expect, it, vi } from "vitest"
import { loadCoinCreatePageData } from "./coin-create-route-data"

vi.mock("@/components/access-denied", () => ({
  AccessDenied: () => "Access denied",
}))

vi.mock("./coin-form", () => ({
  CoinForm: () => "Coin form",
}))

const options = {
  catalogues: [],
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
  compositions: [
    {
      id: "composition-1",
      code: "silver-900",
      name: "Silver .900",
      description: null,
      createdAt: new Date("2026-07-05T00:00:00.000Z"),
      updatedAt: new Date("2026-07-05T00:00:00.000Z"),
    },
  ],
  currencies: [
    {
      id: "currency-1",
      code: "euro",
      name: "Euro",
      fullName: "Euro",
      createdAt: new Date("2026-07-05T00:00:00.000Z"),
      updatedAt: new Date("2026-07-05T00:00:00.000Z"),
    },
  ],
  engravers: [],
  mints: [],
  orientations: [],
  shapes: [],
  techniques: [],
  edges: [],
  rims: [],
  themes: [],
}

const apiOptions = {
  ...options,
  mintingTechniques: options.techniques,
}

describe("loadCoinCreatePageData", () => {
  it("rejects signed-in Collectors without editor access", async () => {
    await expect(
      loadCoinCreatePageData(
        { role: "collector" },
        {
          getCoinMaintenanceOptions: vi.fn(),
        }
      )
    ).resolves.toStrictEqual({
      status: "error",
    })
  })

  it("returns the eager lookup options for Editors and Admins", async () => {
    const dependencies = {
      getCoinMaintenanceOptions: vi.fn().mockResolvedValue(apiOptions),
    }

    await expect(
      loadCoinCreatePageData({ role: "editor" }, dependencies)
    ).resolves.toStrictEqual({
      status: "success",
      options,
    })
  })
})
