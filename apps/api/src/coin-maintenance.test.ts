import { describe, expect, it, vi } from "vitest"

import { createApiApp } from "./app"
import { SurfaceImageUploadReferenceError } from "./surface-image-storage"

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
const replaceBody = {
  ...createBody,
  surfaces: {
    obverse: {
      ...createBody.surfaces.obverse,
      imageUrl: null,
    },
    reverse: null,
    edge: null,
  },
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
    prepareSurfaceImageUpload: async () => ({
      imageUrl:
        "https://images.coinarchive.app/surface-images/published/obverse",
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
    const prepareSurfaceImageUpload = vi.fn().mockResolvedValue({
      imageUrl:
        "https://images.coinarchive.app/surface-images/published/obverse",
    })
    const completeMaintenanceCoinCreate = vi.fn(async (input) => ({
      status: "created" as const,
      coin: { id: input.fields.issuerId },
    }))
    const finalizeSurfaceImageUpload = vi.fn()
    const response = await createApp({
      prepareSurfaceImageUpload,
      finalizeSurfaceImageUpload,
      completeMaintenanceCoinCreate,
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
    expect(prepareSurfaceImageUpload).toHaveBeenCalledWith(
      "obverse-upload",
      "obverse"
    )
    expect(completeMaintenanceCoinCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        collectorId: "collector-id",
        idempotencyKey: "coin-attempt-1",
        requestHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        fields: expect.objectContaining({ issuerId: id }),
      })
    )
    expect(finalizeSurfaceImageUpload).toHaveBeenCalledWith(
      "obverse-upload",
      "obverse"
    )
  })

  it("keeps decimal strings exact when creating a Coin", async () => {
    const completeMaintenanceCoinCreate = vi.fn(async (input) => ({
      status: "created" as const,
      coin: { id: input.fields.issuerId },
    }))
    const response = await createApp({
      completeMaintenanceCoinCreate,
    }).request("https://api.coinarchive.app/api/v1/maintenance/coins", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": "precise-coin-attempt",
      },
      body: JSON.stringify({
        ...createBody,
        faceValueNumericValue: "99999999999999.999999",
      }),
    })

    expect(response.status).toBe(201)
    expect(completeMaintenanceCoinCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        fields: expect.objectContaining({
          faceValueNumericValue: "99999999999999.999999",
        }),
      })
    )
  })

  it("replays a completed create without touching the temporary upload", async () => {
    const prepareSurfaceImageUpload = vi.fn()
    const completeMaintenanceCoinCreate = vi.fn()
    const response = await createApp({
      reserveMaintenanceCoinCreate: vi.fn().mockResolvedValue({
        status: "replayed",
        coin: { id },
      }),
      prepareSurfaceImageUpload,
      completeMaintenanceCoinCreate,
    }).request("https://api.coinarchive.app/api/v1/maintenance/coins", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": "coin-attempt-1",
      },
      body: JSON.stringify(createBody),
    })

    expect(response.status).toBe(201)
    expect(prepareSurfaceImageUpload).not.toHaveBeenCalled()
    expect(completeMaintenanceCoinCreate).not.toHaveBeenCalled()
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
        completeMaintenanceCoinCreate: vi
          .fn()
          .mockRejectedValue({ code: "23503" }),
      })
    )
    expect(missing.status).toBe(409)
    await expect(missing.json()).resolves.toMatchObject({
      code: "coin_relationship_not_found",
    })

    const badUpload = await request(
      createApp({
        prepareSurfaceImageUpload: vi
          .fn()
          .mockRejectedValue(
            new SurfaceImageUploadReferenceError("invalid", "invalid upload")
          ),
      })
    )
    expect(badUpload.status).toBe(422)
    await expect(badUpload.json()).resolves.toMatchObject({
      code: "surface_image_upload_invalid",
    })

    const mismatch = await request(
      createApp({
        reserveMaintenanceCoinCreate: vi
          .fn()
          .mockResolvedValue({ status: "mismatch" }),
      })
    )
    expect(mismatch.status).toBe(409)
    await expect(mismatch.json()).resolves.toMatchObject({
      code: "idempotency_key_reused",
    })
  })

  it("rejects an already-claimed upload before publication", async () => {
    const prepareSurfaceImageUpload = vi.fn()
    const response = await createApp({
      claimSurfaceImageUpload: vi.fn().mockResolvedValue(false),
      prepareSurfaceImageUpload,
    }).request("https://api.coinarchive.app/api/v1/maintenance/coins", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": "coin-attempt-1",
      },
      body: JSON.stringify(createBody),
    })

    expect(response.status).toBe(422)
    expect(prepareSurfaceImageUpload).not.toHaveBeenCalled()
  })

  it("records temporary-upload finalization failures after persistence", async () => {
    const recordSurfaceImageCleanupFailures = vi.fn()
    const response = await createApp({
      completeMaintenanceCoinCreate: vi.fn().mockResolvedValue({
        status: "created",
        coin: { id },
      }),
      finalizeSurfaceImageUpload: vi
        .fn()
        .mockRejectedValue(new Error("temporary delete failed")),
      recordSurfaceImageCleanupFailures,
    }).request("https://api.coinarchive.app/api/v1/maintenance/coins", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": "coin-attempt-1",
      },
      body: JSON.stringify(createBody),
    })

    expect(response.status).toBe(201)
    expect(recordSurfaceImageCleanupFailures).toHaveBeenCalledWith({
      cleanupSubjectId: id,
      failures: [
        expect.objectContaining({
          errorMessage: expect.stringContaining("finalization failed"),
          imageUrl: "temporary-upload-reference:obverse-upload",
        }),
      ],
    })
  })

  it("sanitizes unexpected persistence failures", async () => {
    const deletePublishedSurfaceImage = vi.fn()
    const response = await createApp({
      prepareSurfaceImageUpload: vi.fn().mockResolvedValue({
        imageUrl:
          "https://images.coinarchive.app/surface-images/published/obverse",
      }),
      deletePublishedSurfaceImage,
      completeMaintenanceCoinCreate: vi.fn(async () => {
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

  it("durably records a failed published-image rollback", async () => {
    const recordSurfaceImageCleanupFailures = vi.fn()
    const response = await createApp({
      completeMaintenanceCoinCreate: vi
        .fn()
        .mockRejectedValue(new Error("database")),
      deletePublishedSurfaceImage: vi
        .fn()
        .mockRejectedValue(new Error("storage unavailable")),
      recordSurfaceImageCleanupFailures,
    }).request("https://api.coinarchive.app/api/v1/maintenance/coins", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": "coin-attempt-1",
      },
      body: JSON.stringify(createBody),
    })

    expect(response.status).toBe(500)
    expect(recordSurfaceImageCleanupFailures).toHaveBeenCalledWith({
      cleanupSubjectId: expect.stringMatching(/^[0-9a-f-]{36}$/),
      failures: [
        expect.objectContaining({
          errorMessage: "storage unavailable",
          imageUrl:
            "https://images.coinarchive.app/surface-images/published/obverse",
        }),
      ],
    })
  })

  it("does not delete published images after an ambiguous completed commit", async () => {
    const deletePublishedSurfaceImage = vi.fn()
    const response = await createApp({
      completeMaintenanceCoinCreate: vi
        .fn()
        .mockRejectedValue(new Error("commit response lost")),
      releaseCoinCreateResources: vi.fn().mockResolvedValue(false),
      deletePublishedSurfaceImage,
    }).request("https://api.coinarchive.app/api/v1/maintenance/coins", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": "coin-attempt-1",
      },
      body: JSON.stringify(createBody),
    })

    expect(response.status).toBe(500)
    expect(deletePublishedSurfaceImage).not.toHaveBeenCalled()
  })

  it("does not classify object storage failures as invalid uploads", async () => {
    const response = await createApp({
      prepareSurfaceImageUpload: vi
        .fn()
        .mockRejectedValue(new Error("secret R2 outage")),
    }).request("https://api.coinarchive.app/api/v1/maintenance/coins", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": "coin-attempt-1",
      },
      body: JSON.stringify(createBody),
    })

    expect(response.status).toBe(500)
    expect(JSON.stringify(await response.json())).not.toContain("secret R2")
  })
})

describe("protected Coin Maintenance replacement", () => {
  it("requires a contract-valid If-Match and validates the complete input", async () => {
    const missing = await createApp().request(
      `https://api.coinarchive.app/api/v1/maintenance/coins/${id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(replaceBody),
      }
    )
    const invalidHeader = await createApp().request(
      `https://api.coinarchive.app/api/v1/maintenance/coins/${id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json", "If-Match": "bad" },
        body: JSON.stringify(replaceBody),
      }
    )
    const invalidBody = await createApp().request(
      `https://api.coinarchive.app/api/v1/maintenance/coins/${id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "If-Match": '"MDE4ZjFhMTEtYWFhYS03MDAwLTgwMDAtMDAwMDAwMDAwMDAxOjE"',
        },
        body: JSON.stringify({ ...replaceBody, issuerId: "not-a-uuid" }),
      }
    )

    expect(missing.status).toBe(400)
    await expect(missing.json()).resolves.toMatchObject({
      code: "if_match_required",
    })
    expect(invalidHeader.status).toBe(400)
    await expect(invalidHeader.json()).resolves.toMatchObject({
      code: "invalid_if_match",
    })
    expect(invalidBody.status).toBe(422)
    await expect(invalidBody.json()).resolves.toMatchObject({
      code: "coin_validation_failed",
      invalidParams: [{ name: "/issuerId", code: "coin_field_invalid" }],
    })
  })

  it("replaces the complete aggregate with If-Match and returns the next ETag", async () => {
    const replaceMaintenanceCoin = vi.fn().mockResolvedValue({
      status: "updated",
      coin: { id, version: 2 },
    })
    const app = createApp({
      replaceMaintenanceCoin,
      getMaintenanceCoin: vi
        .fn()
        .mockResolvedValueOnce(detail)
        .mockResolvedValueOnce(detail)
        .mockResolvedValueOnce({
          ...detail,
          title: "Updated Coin",
          version: 2,
        }),
    })
    const loaded = await app.request(
      `https://api.coinarchive.app/api/v1/maintenance/coins/${id}`
    )
    const ifMatch = loaded.headers.get("etag")!
    const response = await app.request(
      `https://api.coinarchive.app/api/v1/maintenance/coins/${id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json", "If-Match": ifMatch },
        body: JSON.stringify({ ...replaceBody, title: "Updated Coin" }),
      }
    )

    expect(response.status).toBe(200)
    expect(response.headers.get("etag")).not.toBe(ifMatch)
    await expect(response.json()).resolves.toMatchObject({
      data: { id, title: "Updated Coin", version: 2 },
    })
    expect(replaceMaintenanceCoin).toHaveBeenCalledWith(
      expect.objectContaining({
        id,
        expectedVersion: 1,
        fields: expect.objectContaining({ title: "Updated Coin" }),
      })
    )
  })

  it("returns a stable 412 problem for a stale replacement", async () => {
    const response = await createApp({
      replaceMaintenanceCoin: vi.fn().mockResolvedValue({ status: "stale" }),
    }).request(`https://api.coinarchive.app/api/v1/maintenance/coins/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "If-Match": '"MDE4ZjFhMTEtYWFhYS03MDAwLTgwMDAtMDAwMDAwMDAwMDAxOjE"',
      },
      body: JSON.stringify(replaceBody),
    })

    expect(response.status).toBe(412)
    await expect(response.json()).resolves.toMatchObject({
      code: "coin_precondition_failed",
    })
  })

  it("records failed rollback of a verified image when replacement is stale", async () => {
    const newImageUrl =
      "https://images.coinarchive.app/surface-images/published/new.webp"
    const recordSurfaceImageCleanupFailures = vi.fn()
    const releaseSurfaceImageUploadClaim = vi.fn()
    const response = await createApp({
      replaceMaintenanceCoin: vi.fn().mockResolvedValue({ status: "stale" }),
      prepareSurfaceImageUpload: vi.fn().mockResolvedValue({
        imageUrl: newImageUrl,
      }),
      deletePublishedSurfaceImage: vi
        .fn()
        .mockRejectedValue(new Error("rollback unavailable")),
      recordSurfaceImageCleanupFailures,
      releaseSurfaceImageUploadClaim,
    }).request(`https://api.coinarchive.app/api/v1/maintenance/coins/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "If-Match": '"MDE4ZjFhMTEtYWFhYS03MDAwLTgwMDAtMDAwMDAwMDAwMDAxOjE"',
      },
      body: JSON.stringify({
        ...replaceBody,
        surfaces: {
          ...replaceBody.surfaces,
          obverse: {
            ...replaceBody.surfaces.obverse,
            imageUploadReference: "new-obverse-upload",
          },
        },
      }),
    })

    expect(response.status).toBe(412)
    expect(recordSurfaceImageCleanupFailures).toHaveBeenCalledWith({
      cleanupSubjectId: id,
      failures: [
        { imageUrl: newImageUrl, errorMessage: "rollback unavailable" },
      ],
    })
    expect(releaseSurfaceImageUploadClaim).not.toHaveBeenCalled()
  })

  it("cleans prepared images and records upload-claim release failures", async () => {
    const recordSurfaceImageCleanupFailures = vi.fn()
    const deletePublishedSurfaceImage = vi.fn()
    const releaseSurfaceImageUploadClaim = vi
      .fn()
      .mockRejectedValue(new Error("claim database unavailable"))
    const response = await createApp({
      replaceMaintenanceCoin: vi.fn().mockResolvedValue({ status: "stale" }),
      prepareSurfaceImageUpload: vi.fn().mockResolvedValue({
        imageUrl:
          "https://images.coinarchive.app/surface-images/published/new.webp",
      }),
      deletePublishedSurfaceImage,
      releaseSurfaceImageUploadClaim,
      recordSurfaceImageCleanupFailures,
    }).request(`https://api.coinarchive.app/api/v1/maintenance/coins/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "If-Match": '"MDE4ZjFhMTEtYWFhYS03MDAwLTgwMDAtMDAwMDAwMDAwMDAxOjE"',
      },
      body: JSON.stringify({
        ...replaceBody,
        surfaces: {
          ...replaceBody.surfaces,
          obverse: {
            ...replaceBody.surfaces.obverse,
            imageUploadReference: "new-obverse-upload",
          },
        },
      }),
    })

    expect(response.status).toBe(412)
    expect(deletePublishedSurfaceImage).toHaveBeenCalled()
    expect(
      deletePublishedSurfaceImage.mock.invocationCallOrder[0]
    ).toBeLessThan(releaseSurfaceImageUploadClaim.mock.invocationCallOrder[0])
    expect(recordSurfaceImageCleanupFailures).toHaveBeenCalledWith({
      cleanupSubjectId: id,
      failures: [
        {
          imageUrl: expect.stringMatching(/^temporary-upload-claim:/),
          errorMessage:
            "Temporary upload claim release failed: claim database unavailable",
        },
      ],
    })
  })

  it("verifies new images before persistence and removes replaced images only afterward", async () => {
    const oldImageUrl =
      "https://images.coinarchive.app/surface-images/published/old.webp"
    const newImageUrl =
      "https://images.coinarchive.app/surface-images/published/new.webp"
    const previous = {
      ...detail,
      surfaces: {
        ...detail.surfaces,
        obverse: {
          description: "Old portrait",
          lettering: null,
          imageUrl: oldImageUrl,
          engraverIds: [],
        },
      },
    }
    const next = {
      ...detail,
      version: 2,
      surfaces: {
        obverse: null,
        reverse: {
          description: "New design",
          lettering: null,
          imageUrl: newImageUrl,
          engraverIds: [],
        },
        edge: null,
      },
    }
    const prepareSurfaceImageUpload = vi.fn().mockResolvedValue({
      imageUrl: newImageUrl,
    })
    const replaceMaintenanceCoin = vi.fn().mockResolvedValue({
      status: "updated",
      coin: { id, version: 2 },
    })
    const deletePublishedSurfaceImage = vi.fn()
    const finalizeSurfaceImageUpload = vi.fn()
    const response = await createApp({
      getMaintenanceCoin: vi
        .fn()
        .mockResolvedValueOnce(previous)
        .mockResolvedValueOnce(next),
      prepareSurfaceImageUpload,
      replaceMaintenanceCoin,
      deletePublishedSurfaceImage,
      finalizeSurfaceImageUpload,
    }).request(`https://api.coinarchive.app/api/v1/maintenance/coins/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "If-Match": '"MDE4ZjFhMTEtYWFhYS03MDAwLTgwMDAtMDAwMDAwMDAwMDAxOjE"',
      },
      body: JSON.stringify({
        ...replaceBody,
        surfaces: {
          obverse: null,
          reverse: {
            description: "New design",
            lettering: null,
            imageUrl: null,
            imageUploadReference: "new-reverse-upload",
            engraverIds: [],
          },
          edge: null,
        },
      }),
    })

    expect(response.status).toBe(200)
    expect(prepareSurfaceImageUpload).toHaveBeenCalledWith(
      "new-reverse-upload",
      "reverse"
    )
    expect(prepareSurfaceImageUpload.mock.invocationCallOrder[0]).toBeLessThan(
      replaceMaintenanceCoin.mock.invocationCallOrder[0]
    )
    expect(deletePublishedSurfaceImage).toHaveBeenCalledWith(oldImageUrl)
    expect(
      deletePublishedSurfaceImage.mock.invocationCallOrder[0]
    ).toBeGreaterThan(replaceMaintenanceCoin.mock.invocationCallOrder[0])
    expect(finalizeSurfaceImageUpload).toHaveBeenCalledWith(
      "new-reverse-upload",
      "reverse"
    )
  })

  it("returns success and durably records old-image cleanup failures", async () => {
    const oldImageUrl =
      "https://images.coinarchive.app/surface-images/published/old.webp"
    const recordSurfaceImageCleanupFailures = vi.fn()
    const response = await createApp({
      getMaintenanceCoin: vi
        .fn()
        .mockResolvedValueOnce({
          ...detail,
          surfaces: {
            ...detail.surfaces,
            obverse: {
              description: null,
              lettering: null,
              imageUrl: oldImageUrl,
              engraverIds: [],
            },
          },
        })
        .mockResolvedValueOnce({ ...detail, version: 2 }),
      replaceMaintenanceCoin: vi.fn().mockResolvedValue({
        status: "updated",
        coin: { id, version: 2 },
      }),
      deletePublishedSurfaceImage: vi
        .fn()
        .mockRejectedValue(new Error("R2 unavailable")),
      recordSurfaceImageCleanupFailures,
    }).request(`https://api.coinarchive.app/api/v1/maintenance/coins/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "If-Match": '"MDE4ZjFhMTEtYWFhYS03MDAwLTgwMDAtMDAwMDAwMDAwMDAxOjE"',
      },
      body: JSON.stringify({
        ...replaceBody,
        surfaces: { obverse: null, reverse: null, edge: null },
      }),
    })

    expect(response.status).toBe(200)
    expect(recordSurfaceImageCleanupFailures).toHaveBeenCalledWith({
      cleanupSubjectId: id,
      failures: [{ imageUrl: oldImageUrl, errorMessage: "R2 unavailable" }],
    })
  })
})

describe("protected Coin Maintenance deletion", () => {
  it("hard-deletes with If-Match before removing published Surface Images", async () => {
    const events: string[] = []
    const imageUrl =
      "https://images.coinarchive.app/surface-images/published/obverse"
    const deleteMaintenanceCoin = vi.fn().mockImplementation(async () => {
      events.push("delete-aggregate")
      return { status: "deleted", coin: { id }, surfaceImageUrls: [imageUrl] }
    })
    const deletePublishedSurfaceImage = vi.fn().mockImplementation(async () => {
      events.push("delete-image")
    })
    const response = await createApp({
      deleteMaintenanceCoin,
      deletePublishedSurfaceImage,
    }).request(`https://api.coinarchive.app/api/v1/maintenance/coins/${id}`, {
      method: "DELETE",
      headers: {
        "If-Match": '"MDE4ZjFhMTEtYWFhYS03MDAwLTgwMDAtMDAwMDAwMDAwMDAxOjE"',
      },
    })

    expect(response.status).toBe(204)
    expect(await response.text()).toBe("")
    expect(deleteMaintenanceCoin).toHaveBeenCalledWith({
      id,
      expectedVersion: 1,
    })
    expect(events).toStrictEqual(["delete-aggregate", "delete-image"])
  })

  it("requires If-Match and rejects a stale deletion with 412", async () => {
    const missingPrecondition = await createApp().request(
      `https://api.coinarchive.app/api/v1/maintenance/coins/${id}`,
      { method: "DELETE" }
    )
    const stale = await createApp({
      deleteMaintenanceCoin: vi.fn().mockResolvedValue({ status: "stale" }),
    }).request(`https://api.coinarchive.app/api/v1/maintenance/coins/${id}`, {
      method: "DELETE",
      headers: {
        "If-Match": '"MDE4ZjFhMTEtYWFhYS03MDAwLTgwMDAtMDAwMDAwMDAwMDAxOjE"',
      },
    })

    expect(missingPrecondition.status).toBe(400)
    await expect(missingPrecondition.json()).resolves.toMatchObject({
      code: "if_match_required",
    })
    expect(stale.status).toBe(412)
    await expect(stale.json()).resolves.toMatchObject({
      code: "coin_precondition_failed",
    })
  })

  it("retains failed post-delete image cleanup for retry and still returns 204", async () => {
    const imageUrl =
      "https://images.coinarchive.app/surface-images/published/obverse"
    const recordSurfaceImageCleanupFailures = vi.fn()
    const response = await createApp({
      deleteMaintenanceCoin: vi.fn().mockResolvedValue({
        status: "deleted",
        coin: { id },
        surfaceImageUrls: [imageUrl],
      }),
      deletePublishedSurfaceImage: vi
        .fn()
        .mockRejectedValue(new Error("R2 unavailable")),
      recordSurfaceImageCleanupFailures,
    }).request(`https://api.coinarchive.app/api/v1/maintenance/coins/${id}`, {
      method: "DELETE",
      headers: {
        "If-Match": '"MDE4ZjFhMTEtYWFhYS03MDAwLTgwMDAtMDAwMDAwMDAwMDAxOjE"',
      },
    })

    expect(response.status).toBe(204)
    expect(recordSurfaceImageCleanupFailures).toHaveBeenCalledWith({
      cleanupSubjectId: id,
      failures: [{ imageUrl, errorMessage: "R2 unavailable" }],
    })
  })

  it("does not reverse a successful deletion when retry retention is unavailable", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
    const response = await createApp({
      deleteMaintenanceCoin: vi.fn().mockResolvedValue({
        status: "deleted",
        coin: { id },
        surfaceImageUrls: [
          "https://images.coinarchive.app/surface-images/published/obverse",
        ],
      }),
      deletePublishedSurfaceImage: vi
        .fn()
        .mockRejectedValue(new Error("R2 unavailable")),
      recordSurfaceImageCleanupFailures: vi
        .fn()
        .mockRejectedValue(new Error("database unavailable")),
    }).request(`https://api.coinarchive.app/api/v1/maintenance/coins/${id}`, {
      method: "DELETE",
      headers: {
        "If-Match": '"MDE4ZjFhMTEtYWFhYS03MDAwLTgwMDAtMDAwMDAwMDAwMDAxOjE"',
      },
    })

    expect(response.status).toBe(204)
    expect(consoleError).toHaveBeenCalledWith(
      "Failed to retain Surface Image cleanup failures after Coin deletion."
    )
    consoleError.mockRestore()
  })

  it("authorizes Editors and Admins but rejects other Collectors", async () => {
    const request = (role: "admin" | "editor" | "collector" | null) =>
      createApp({
        getCollector: async () =>
          role === null ? null : { id: "collector-id", role },
        deleteMaintenanceCoin: vi.fn().mockResolvedValue({
          status: "deleted",
          coin: { id },
          surfaceImageUrls: [],
        }),
      }).request(`https://api.coinarchive.app/api/v1/maintenance/coins/${id}`, {
        method: "DELETE",
        headers: {
          "If-Match": '"MDE4ZjFhMTEtYWFhYS03MDAwLTgwMDAtMDAwMDAwMDAwMDAxOjE"',
        },
      })

    expect((await request(null)).status).toBe(401)
    expect((await request("collector")).status).toBe(403)
    expect((await request("editor")).status).toBe(204)
    expect((await request("admin")).status).toBe(204)
  })
})
