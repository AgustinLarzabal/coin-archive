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
const createBody = {
  title: "2 Pesos",
  comments: null,
  compositionDescription: null,
  compositionId: id,
  currencyId: id,
  diameter: "23.5",
  distributionId: id,
  edgeId: null,
  faceValueNumericValue: "2",
  faceValueText: "2 Pesos",
  isDemonetized: null,
  issuerId: id,
  maxYear: 2026,
  mintIds: [],
  minYear: 2025,
  mintage: "1000000",
  orientationId: null,
  references: [],
  rimId: null,
  rulerIds: [id],
  shapeId: null,
  surfaces: {
    obverse: {
      description: "Portrait",
      lettering: null,
      imageUploadReference: "obverse-upload",
      engraverIds: [],
    },
    reverse: null,
    edge: null,
  },
  techniqueId: null,
  themeIds: [],
  thickness: null,
  weight: "7.2",
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

describe("protected Coin Maintenance create", () => {
  it("creates the complete aggregate with a verified upload and returns 201 metadata", async () => {
    const consumeSurfaceImageUpload = vi.fn().mockResolvedValue({
      imageUrl:
        "https://images.coinarchive.app/surface-images/published/obverse",
    })
    const createMaintenanceCoin = vi.fn(async (_input, prepareFields) => ({
      status: "created" as const,
      coin: { id: (await prepareFields()).issuerId },
    }))
    const response = await createApp({
      consumeSurfaceImageUpload,
      createMaintenanceCoin,
    }).request("https://api.coinarchive.app/api/v1/maintenance/coins", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": "coin-attempt-1",
      },
      body: JSON.stringify(createBody),
    })

    expect(response.status).toBe(201)
    expect(response.headers.get("location")).toBe(
      `/api/v1/maintenance/coins/${id}`
    )
    expect(response.headers.get("etag")).toMatch(/^"[A-Za-z0-9_-]+"$/)
    await expect(response.json()).resolves.toMatchObject({
      data: { id, title: "2 Pesos", surfaces: { obverse: null } },
    })
    expect(consumeSurfaceImageUpload).toHaveBeenCalledWith(
      "obverse-upload",
      "obverse"
    )
    expect(createMaintenanceCoin).toHaveBeenCalledWith(
      expect.objectContaining({
        collectorId: "collector-id",
        idempotencyKey: "coin-attempt-1",
        requestHash: expect.stringMatching(/^[a-f0-9]{64}$/),
      }),
      expect.any(Function)
    )
  })

  it("rejects invalid input, missing relationships, invalid uploads, and key reuse with stable problems", async () => {
    const request = (app: ReturnType<typeof createApp>, body = createBody) =>
      app.request("https://api.coinarchive.app/api/v1/maintenance/coins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": "coin-attempt-1",
        },
        body: JSON.stringify(body),
      })

    const invalid = await request(createApp(), {
      ...createBody,
      issuerId: "not-a-uuid",
    })
    expect(invalid.status).toBe(422)
    await expect(invalid.json()).resolves.toMatchObject({
      code: "coin_validation_failed",
      invalidParams: [{ name: "/issuerId", code: "coin_field_invalid" }],
    })

    const missing = await request(
      createApp({
        createMaintenanceCoin: vi.fn().mockRejectedValue({ code: "23503" }),
      })
    )
    expect(missing.status).toBe(409)
    await expect(missing.json()).resolves.toMatchObject({
      code: "coin_relationship_not_found",
    })

    const badUpload = await request(
      createApp({
        consumeSurfaceImageUpload: vi
          .fn()
          .mockRejectedValue(new Error("invalid upload")),
        createMaintenanceCoin: vi.fn(async (_input, prepareFields) => {
          await prepareFields()
          throw new Error("unreachable")
        }),
      })
    )
    expect(badUpload.status).toBe(422)
    await expect(badUpload.json()).resolves.toMatchObject({
      code: "surface_image_upload_invalid",
    })

    const mismatch = await request(
      createApp({
        createMaintenanceCoin: vi
          .fn()
          .mockResolvedValue({ status: "mismatch" }),
      })
    )
    expect(mismatch.status).toBe(409)
    await expect(mismatch.json()).resolves.toMatchObject({
      code: "idempotency_key_reused",
    })
  })

  it("sanitizes unexpected persistence failures", async () => {
    const deletePublishedSurfaceImage = vi.fn()
    const response = await createApp({
      consumeSurfaceImageUpload: vi.fn().mockResolvedValue({
        imageUrl:
          "https://images.coinarchive.app/surface-images/published/obverse",
      }),
      deletePublishedSurfaceImage,
      createMaintenanceCoin: vi.fn(async (_input, prepareFields) => {
        await prepareFields()
        throw new Error("secret SQL")
      }),
    }).request("https://api.coinarchive.app/api/v1/maintenance/coins", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": "coin-attempt-1",
      },
      body: JSON.stringify(createBody),
    })
    expect(response.status).toBe(500)
    expect(JSON.stringify(await response.json())).not.toContain("secret SQL")
    expect(deletePublishedSurfaceImage).toHaveBeenCalledWith(
      "https://images.coinarchive.app/surface-images/published/obverse"
    )
  })
})
