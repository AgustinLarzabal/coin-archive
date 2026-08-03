import { describe, expect, it, vi } from "vitest"
import type { CoinMaintenanceRecord } from "@coin-archive/db"
import { loadCoinEditPageData } from "./coin-edit-route-data"

vi.mock("@/components/access-denied", () => ({
  AccessDenied: () => "Access denied",
}))

vi.mock("./coin-form", () => ({
  CoinForm: () => "Coin form",
}))

const coin: CoinMaintenanceRecord = {
  id: "coin-1",
  title: "Spanish Test Coin",
  comments: "Public note",
  compositionDescription: "Outer ring: nickel-brass; core: copper-nickel.",
  compositionId: "composition-1",
  currencyId: "currency-1",
  diameter: 24,
  distributionId: "distribution-1",
  edgeId: null,
  faceValueNumericValue: 1,
  faceValueText: "1 Euro",
  isDemonetized: null,
  issuerId: "issuer-1",
  maxYear: 2001,
  mintIds: ["mint-1"],
  minYear: 1999,
  mintage: 1000,
  orientationId: null,
  rimId: null,
  rulerIds: ["ruler-1"],
  shapeId: null,
  techniqueId: null,
  themeIds: ["theme-1"],
  thickness: 1.9,
  weight: 7.5,
  references: [],
  surfaces: {
    obverse: null,
    reverse: null,
    edge: null,
  },
  version: 1,
  createdAt: new Date("2026-07-05T00:00:00.000Z"),
  updatedAt: new Date("2026-07-05T00:00:00.000Z"),
}

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

const deleteSummary = {
  title: coin.title,
  rulerAttributions: 1,
  mintAttributions: 1,
  themeAttributions: 1,
  catalogueReferences: 0,
  coinSurfaces: 0,
  engraverAttributions: 0,
}

describe("loadCoinEditPageData", () => {
  it("rejects signed-in Collectors without editor access", async () => {
    await expect(
      loadCoinEditPageData(
        { role: "collector" },
        {
          coinId: coin.id,
        },
        {
          getCoinMaintenanceDeleteSummary: vi.fn(),
          getCoinMaintenanceRecord: vi.fn(),
          getCoinMaintenanceOptions: vi.fn(),
        }
      )
    ).resolves.toStrictEqual({
      status: "error",
    })
  })

  it("returns the current Coin and lookup options for Editors and Admins", async () => {
    const dependencies = {
      getCoinMaintenanceDeleteSummary: vi.fn().mockResolvedValue(deleteSummary),
      getCoinMaintenanceRecord: vi.fn().mockResolvedValue(coin),
      getCoinMaintenanceOptions: vi.fn().mockResolvedValue(apiOptions),
    }

    await expect(
      loadCoinEditPageData({ role: "admin" }, { coinId: coin.id }, dependencies)
    ).resolves.toStrictEqual({
      status: "success",
      coin,
      deleteSummary,
      options,
    })
  })

  it("preserves the missing-Coin state returned by the API adapter", async () => {
    await expect(
      loadCoinEditPageData(
        { role: "editor" },
        { coinId: coin.id },
        {
          getCoinMaintenanceDeleteSummary: vi.fn().mockResolvedValue(null),
          getCoinMaintenanceRecord: vi.fn().mockResolvedValue(null),
          getCoinMaintenanceOptions: vi.fn().mockResolvedValue(apiOptions),
        }
      )
    ).resolves.toStrictEqual({
      status: "success",
      coin: null,
      deleteSummary: null,
      options,
    })
  })
})
