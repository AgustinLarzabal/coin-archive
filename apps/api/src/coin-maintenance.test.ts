import { describe, expect, it, vi } from "vitest"

import { createApiApp } from "./app"

const id = "018f1a11-aaaa-7000-8000-000000000001"
const detail = {
  id,
  title: "2 Pesos",
  comments: null,
  compositionDescription: null,
  compositionId: id,
  currencyId: id,
  diameter: 23.5,
  distributionId: id,
  edgeId: null,
  faceValueNumericValue: 2,
  faceValueText: "2 Pesos",
  isDemonetized: null,
  issuerId: id,
  maxYear: 2026,
  mintIds: [],
  minYear: 2025,
  mintage: 1_000_000,
  orientationId: null,
  rimId: null,
  rulerIds: [id],
  shapeId: null,
  techniqueId: null,
  themeIds: [],
  thickness: null,
  weight: 7.2,
  references: [{ catalogueId: id, number: "123" }],
  surfaces: { obverse: null, reverse: null, edge: null },
  version: 1,
  createdAt: new Date("2026-08-03T10:15:30.000Z"),
  updatedAt: new Date("2026-08-03T10:15:30.000Z"),
}

function createApp(
  overrides: Partial<Parameters<typeof createApiApp>[0]> = {}
) {
  return createApiApp({
    environment: "production",
    surfaceImageOrigin: "https://images.coinarchive.app",
    browseCoins: async () => [],
    getCollector: async () => ({ id: "collector-id", role: "editor" }),
    listMaintenanceCoins: async () => [],
    getMaintenanceCoin: async () => detail,
    getMaintenanceCoinDeleteSummary: async () => ({
      title: detail.title,
      rulerAttributions: 1,
      mintAttributions: 0,
      themeAttributions: 0,
      catalogueReferences: 1,
      coinSurfaces: 0,
      engraverAttributions: 0,
    }),
    getCoinMaintenanceOptions: async () => ({
      catalogues: [],
      compositions: [],
      currencies: [],
      distributions: [],
      edges: [],
      engravers: [],
      issuers: [],
      mints: [],
      orientations: [],
      rims: [],
      rulers: [],
      shapes: [],
      mintingTechniques: [],
      themes: [],
    }),
    ...overrides,
  })
}

describe("protected Coin Maintenance reads", () => {
  it("returns cursor-paginated filtered listing", async () => {
    const first = {
      id,
      title: "2 Pesos",
      issuer: { id, code: "argentina", name: "Argentina" },
      minYear: 2025,
      maxYear: 2026,
      faceValue: {
        text: "2 Pesos",
        currency: { id, code: "peso", name: "Peso" },
      },
      distribution: { id, code: "circulation", name: "Circulation" },
      composition: { id, code: "silver", name: "Silver" },
      createdAt: detail.createdAt,
      updatedAt: detail.updatedAt,
      cursorValue: detail.updatedAt.toISOString(),
      cursorSecondaryValue: "2 pesos",
    }
    const listMaintenanceCoins = vi.fn(async () => [
      first,
      { ...first, id: "018f1a11-aaaa-7000-8000-000000000002" },
    ])
    const response = await createApp({ listMaintenanceCoins }).request(
      "https://api.coinarchive.app/api/v1/maintenance/coins?limit=1&q=pesos&issuer=argentina&sort=updatedAt&order=desc"
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      data: [{ id, createdAt: "2026-08-03T10:15:30.000Z" }],
      nextCursor: expect.any(String),
    })
    expect(listMaintenanceCoins).toHaveBeenCalledWith({
      q: "pesos",
      issuerCode: "argentina",
      rulerCode: undefined,
      distributionCode: undefined,
      currencyCode: undefined,
      compositionCode: undefined,
      limit: 2,
      sort: "updatedAt",
      order: "desc",
    })
  })

  it("returns complete editable detail with canonical decimals and ETag", async () => {
    const response = await createApp().request(
      `https://api.coinarchive.app/api/v1/maintenance/coins/${id}`
    )
    expect(response.status).toBe(200)
    expect(response.headers.get("etag")).toMatch(/^"[A-Za-z0-9_-]+"$/)
    await expect(response.json()).resolves.toMatchObject({
      data: {
        id,
        diameter: "23.5",
        faceValueNumericValue: "2",
        mintage: "1000000",
        weight: "7.2",
        version: 1,
        etag: expect.any(String),
      },
    })
  })

  it("returns combined options and deletion summary, and reports missing Coins", async () => {
    const app = createApp({
      getCoinMaintenanceOptions: async () => ({
        catalogues: [],
        compositions: [],
        currencies: [],
        distributions: [],
        edges: [],
        engravers: [],
        issuers: [{ id, code: "argentina", isoCode: "AR", name: "Argentina" }],
        mints: [],
        orientations: [],
        rims: [],
        rulers: [],
        shapes: [],
        mintingTechniques: [],
        themes: [],
      }),
    })
    const optionsResponse = await app.request(
      "https://api.coinarchive.app/api/v1/maintenance/coins/options"
    )
    expect(optionsResponse.status).toBe(200)
    await expect(optionsResponse.json()).resolves.toMatchObject({
      data: { issuers: [{ code: "argentina", name: "Argentina" }] },
    })
    expect(
      (
        await app.request(
          `https://api.coinarchive.app/api/v1/maintenance/coins/${id}/deletion-summary`
        )
      ).status
    ).toBe(200)

    const missing = await createApp({
      getMaintenanceCoin: async () => null,
    }).request(
      "https://api.coinarchive.app/api/v1/maintenance/coins/018f1a11-aaaa-7000-8000-000000000099"
    )
    expect(missing.status).toBe(404)
    await expect(missing.json()).resolves.toMatchObject({
      code: "coin_not_found",
    })
  })

  it("enforces authentication and Editor access", async () => {
    expect(
      (
        await createApp({ getCollector: async () => null }).request(
          "https://api.coinarchive.app/api/v1/maintenance/coins"
        )
      ).status
    ).toBe(401)
    expect(
      (
        await createApp({
          getCollector: async () => ({ id: "collector", role: "collector" }),
        }).request("https://api.coinarchive.app/api/v1/maintenance/coins")
      ).status
    ).toBe(403)
  })
})
