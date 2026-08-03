import { describe, expect, it, vi } from "vitest"

import {
  authorizeSurfaceImageUpload,
  COIN_AUTHORIZATION_ERROR,
  COIN_DELETE_CONFIRMATION_ERROR,
  COIN_EDIT_CONFLICT_ERROR,
  COIN_MISSING_ERROR,
  hasCoinMaintenanceAccess,
  removeSurfaceImageUpload,
  submitCreateCoin,
  submitDeleteCoin,
  submitUpdateCoin,
} from "./actions"
import type { CoinDraft } from "./actions"

const VALID_COIN_ID = "2c717ddb-95a2-4dad-a280-f58a4779aee8"
const VALID_LOOKUP_ID = "6f18a1db-9096-433b-b3f1-906c772f7a29"
const OTHER_LOOKUP_ID = "de2dcfb7-dc50-4035-8bc8-33cbbacb586b"
const VALID_ETAG = '"opaque-coin-version"'

const VALID_COIN_DRAFT: CoinDraft = {
  title: "Spanish Test Coin",
  issuerId: VALID_LOOKUP_ID,
  rulers: [{ rulerId: VALID_LOOKUP_ID }],
  distributionId: VALID_LOOKUP_ID,
  compositionId: VALID_LOOKUP_ID,
  compositionDescription: "",
  faceValueText: "1 Test Unit",
  faceValueNumericValue: "1.5",
  currencyId: VALID_LOOKUP_ID,
  mints: [],
  orientationId: "",
  shapeId: "",
  techniqueId: "",
  edgeId: "",
  rimId: "",
  themes: [],
  weight: "",
  diameter: "",
  thickness: "",
  mintage: "",
  comments: "",
  minYear: "",
  maxYear: "",
  demonetizationStatus: "unknown",
  references: [],
  surfaces: {
    obverse: {
      description: "",
      lettering: "",
      imageUrl: "",
      engraverIds: [],
    },
    reverse: {
      description: "",
      lettering: "",
      imageUrl: "",
      engraverIds: [],
    },
    edge: {
      description: "",
      lettering: "",
      imageUrl: "",
    },
  },
}

function createDependencies(overrides?: {
  createCoin?: ReturnType<typeof vi.fn>
  deleteCoinMaintenance?: ReturnType<typeof vi.fn>
  deleteSurfaceImage?: ReturnType<typeof vi.fn>
  getCoinSurfaceImageUrls?: ReturnType<typeof vi.fn>
  getCoinMaintenanceDeleteSummary?: ReturnType<typeof vi.fn>
  getPersistedSurfaceImageUrls?: ReturnType<typeof vi.fn>
  recordSurfaceImageCleanupFailures?: ReturnType<typeof vi.fn>
  replaceCoin?: ReturnType<typeof vi.fn>
  updateCoinMaintenance?: ReturnType<typeof vi.fn>
  resolveSurfaceImageUpload?: ReturnType<typeof vi.fn>
}) {
  return {
    createCoin: vi.fn().mockResolvedValue({
      status: 201,
      headers: {},
      body: { data: { id: VALID_COIN_ID } },
    }),
    createIdempotencyKey: () => "coin-attempt-1",
    deleteCoinMaintenance: vi.fn(),
    deleteSurfaceImage: vi.fn(),
    getCoinSurfaceImageUrls: vi.fn().mockResolvedValue([]),
    getCoinMaintenanceDeleteSummary: vi.fn(),
    getPersistedSurfaceImageUrls: vi.fn().mockResolvedValue({
      obverse: null,
      reverse: null,
      edge: null,
    }),
    updateCoinMaintenance: vi.fn(),
    resolveSurfaceImageUpload: vi.fn(),
    recordSurfaceImageCleanupFailures: vi.fn(),
    replaceCoin: vi.fn().mockResolvedValue({
      status: 200,
      headers: { etag: '"next-coin-version"' },
      body: { data: { id: VALID_COIN_ID } },
    }),
    ...overrides,
  }
}

const authorizationErrorResult = {
  status: "error" as const,
  fieldErrors: {},
  formError: COIN_AUTHORIZATION_ERROR,
}

describe("hasCoinMaintenanceAccess", () => {
  it("rejects signed-out and non-editor Collectors", () => {
    expect(hasCoinMaintenanceAccess(null)).toBe(false)
    expect(hasCoinMaintenanceAccess({ role: "collector" })).toBe(false)
    expect(hasCoinMaintenanceAccess({ role: null })).toBe(false)
    expect(hasCoinMaintenanceAccess({ role: "owner" })).toBe(false)
  })

  it("allows Editors and Admins", () => {
    expect(hasCoinMaintenanceAccess({ role: "editor" })).toBe(true)
    expect(hasCoinMaintenanceAccess({ role: "admin" })).toBe(true)
  })
})

describe("submitCreateCoin", () => {
  it("returns an inline authorization error for signed-out or non-editor Collectors", async () => {
    await expect(
      submitCreateCoin(null, VALID_COIN_DRAFT)
    ).resolves.toStrictEqual(authorizationErrorResult)

    await expect(
      submitCreateCoin({ role: "collector" }, VALID_COIN_DRAFT)
    ).resolves.toStrictEqual(authorizationErrorResult)
  })

  it("maps required and numeric validation errors into typed field errors", async () => {
    const dependencies = createDependencies()

    await expect(
      submitCreateCoin(
        { role: "editor" },
        {
          ...VALID_COIN_DRAFT,
          title: " ",
          rulers: [],
          faceValueNumericValue: "0",
          minYear: "2025",
          maxYear: "",
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        title: "Coin Title cannot be blank.",
        rulers: "At least one Ruler Attribution is required.",
        faceValueNumericValue:
          "Face Value numeric value must be greater than 0.",
        minYear: "Issue Year Range requires both years or neither year.",
        maxYear: "Issue Year Range requires both years or neither year.",
      },
    })

    expect(dependencies.createCoin).not.toHaveBeenCalled()
  })

  it("blocks duplicate attributions, Catalogue References, invalid surface image URLs, and duplicate face engravers with path-specific errors", async () => {
    const dependencies = createDependencies()

    await expect(
      submitCreateCoin(
        { role: "editor" },
        {
          ...VALID_COIN_DRAFT,
          rulers: [{ rulerId: VALID_LOOKUP_ID }, { rulerId: VALID_LOOKUP_ID }],
          mints: [{ mintId: VALID_LOOKUP_ID }, { mintId: VALID_LOOKUP_ID }],
          themes: [{ themeId: VALID_LOOKUP_ID }, { themeId: VALID_LOOKUP_ID }],
          references: [
            {
              catalogueId: VALID_LOOKUP_ID,
              number: " KM 12 ",
            },
            {
              catalogueId: VALID_LOOKUP_ID,
              number: "km   12",
            },
          ],
          surfaces: {
            ...VALID_COIN_DRAFT.surfaces,
            obverse: {
              ...VALID_COIN_DRAFT.surfaces.obverse,
              imageUrl: "ftp://example.com/image.jpg",
              engraverIds: [VALID_LOOKUP_ID, VALID_LOOKUP_ID],
            },
          },
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        "rulers.1.rulerId": "Ruler Attribution duplicates another row.",
        "mints.1.mintId": "Mint Attribution duplicates another row.",
        "themes.1.themeId": "Theme Attribution duplicates another row.",
        "references.1.number":
          "Duplicate Catalogue References are not allowed on the same Coin.",
        "surfaces.obverse.imageUrl":
          "Surface Image URL must be an absolute http:// or https:// URL.",
        "surfaces.obverse.engraverIds.1":
          "Duplicate Engraver Attributions are not allowed on the same face.",
      },
    })

    expect(dependencies.createCoin).not.toHaveBeenCalled()
  })

  it("normalizes blank optional scalars and maps aggregate child collections before creating a Coin", async () => {
    const dependencies = createDependencies({
      createCoin: vi.fn().mockResolvedValue({
        status: 201,
        body: { data: { id: VALID_COIN_ID } },
      }),
    })

    await expect(
      submitCreateCoin(
        { role: "editor" },
        {
          ...VALID_COIN_DRAFT,
          title: "  Spanish Test Coin  ",
          compositionDescription:
            "  Outer ring: copper-nickel; core: nickel-brass.  ",
          faceValueText: "  1 Test Unit  ",
          comments: "  Public note.  ",
          mints: [{ mintId: VALID_LOOKUP_ID }],
          themes: [{ themeId: OTHER_LOOKUP_ID }],
          demonetizationStatus: "demonetized",
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "success",
      coinId: VALID_COIN_ID,
      message: "Coin created.",
    })

    expect(dependencies.createCoin).toHaveBeenCalledWith({
      headers: { "idempotency-key": "coin-attempt-1" },
      body: {
        title: "Spanish Test Coin",
        issuerId: VALID_LOOKUP_ID,
        rulerIds: [VALID_LOOKUP_ID],
        distributionId: VALID_LOOKUP_ID,
        compositionId: VALID_LOOKUP_ID,
        compositionDescription:
          "Outer ring: copper-nickel; core: nickel-brass.",
        faceValueText: "1 Test Unit",
        faceValueNumericValue: "1.5",
        currencyId: VALID_LOOKUP_ID,
        mintIds: [VALID_LOOKUP_ID],
        orientationId: null,
        shapeId: null,
        techniqueId: null,
        edgeId: null,
        rimId: null,
        themeIds: [OTHER_LOOKUP_ID],
        weight: null,
        diameter: null,
        thickness: null,
        mintage: null,
        comments: "Public note.",
        minYear: null,
        maxYear: null,
        isDemonetized: true,
        references: [],
        surfaces: {
          obverse: null,
          reverse: null,
          edge: null,
        },
      },
    })
  })

  it("forwards only the authorized Surface Image reference for API verification", async () => {
    const dependencies = createDependencies({
      createCoin: vi.fn().mockResolvedValue({
        status: 201,
        body: { data: { id: VALID_COIN_ID } },
      }),
      resolveSurfaceImageUpload: vi.fn().mockResolvedValue({
        imageUrl: "https://images.example.test/surface-images/opaque-id",
      }),
    })

    await expect(
      submitCreateCoin(
        { role: "editor" },
        {
          ...VALID_COIN_DRAFT,
          surfaces: {
            ...VALID_COIN_DRAFT.surfaces,
            obverse: {
              ...VALID_COIN_DRAFT.surfaces.obverse,
              imageUploadReference: "opaque-upload-reference",
            },
          },
        },
        dependencies
      )
    ).resolves.toMatchObject({ status: "success", coinId: VALID_COIN_ID })

    expect(dependencies.resolveSurfaceImageUpload).not.toHaveBeenCalled()
    expect(dependencies.createCoin).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          surfaces: {
            obverse: expect.objectContaining({
              imageUploadReference: "opaque-upload-reference",
            }),
            reverse: null,
            edge: null,
          },
        }),
      })
    )
  })

  it("does not persist a browser-supplied Surface Image URL without an authorized upload reference", async () => {
    const dependencies = createDependencies({
      createCoin: vi.fn().mockResolvedValue({
        status: 201,
        body: { data: { id: VALID_COIN_ID } },
      }),
    })

    await submitCreateCoin(
      { role: "editor" },
      {
        ...VALID_COIN_DRAFT,
        surfaces: {
          ...VALID_COIN_DRAFT.surfaces,
          obverse: {
            ...VALID_COIN_DRAFT.surfaces.obverse,
            imageUrl: "https://untrusted.example.test/obverse.jpg",
          },
        },
      },
      dependencies
    )

    expect(dependencies.createCoin).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          surfaces: { obverse: null, reverse: null, edge: null },
        }),
      })
    )
  })

  it("does not persist a Coin when its authorized Surface Image cannot pass server inspection", async () => {
    const dependencies = createDependencies({
      createCoin: vi.fn().mockRejectedValue({
        data: { body: { code: "surface_image_upload_invalid" } },
      }),
    })

    await expect(
      submitCreateCoin(
        { role: "editor" },
        {
          ...VALID_COIN_DRAFT,
          surfaces: {
            ...VALID_COIN_DRAFT.surfaces,
            edge: {
              ...VALID_COIN_DRAFT.surfaces.edge,
              imageUploadReference: "opaque-upload-reference",
            },
          },
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: "Unable to save Coin right now.",
    })
    expect(dependencies.createCoin).toHaveBeenCalled()
  })

  it("maps API authorization and validation problems to client-owned feedback", async () => {
    await expect(
      submitCreateCoin(
        { role: "editor" },
        VALID_COIN_DRAFT,
        createDependencies({
          createCoin: vi.fn().mockRejectedValue({
            data: {
              body: {
                code: "coin_validation_failed",
                invalidParams: [
                  { name: "/issuerId", reason: "Issuer no longer exists." },
                ],
              },
            },
          }),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: { issuerId: "Issuer no longer exists." },
    })

    await expect(
      submitCreateCoin(
        { role: "editor" },
        VALID_COIN_DRAFT,
        createDependencies({
          createCoin: vi.fn().mockRejectedValue({
            data: { body: { code: "editor_access_required" } },
          }),
        })
      )
    ).resolves.toStrictEqual(authorizationErrorResult)
  })

  it("leaves published-image rollback to the API when Coin creation fails", async () => {
    const dependencies = createDependencies({
      createCoin: vi.fn().mockRejectedValue(new Error("database error")),
    })

    await submitCreateCoin(
      { role: "editor" },
      {
        ...VALID_COIN_DRAFT,
        surfaces: {
          ...VALID_COIN_DRAFT.surfaces,
          obverse: {
            ...VALID_COIN_DRAFT.surfaces.obverse,
            imageUploadReference: "new-upload-reference",
          },
        },
      },
      dependencies
    )

    expect(dependencies.deleteSurfaceImage).not.toHaveBeenCalled()
  })
})

describe("authorizeSurfaceImageUpload", () => {
  it("uses the typed maintenance API with a client-owned idempotency key", async () => {
    const authorizeUpload = vi.fn().mockResolvedValue({
      status: 201,
      body: {
        reference: "opaque-upload-reference",
        uploadUrl: "https://r2.example.test/presigned",
        expiresAt: "2026-08-03T10:05:00.000Z",
      },
    })
    const input = {
      surface: "obverse" as const,
      contentType: "image/jpeg",
      contentLength: 100,
    }

    await expect(
      authorizeSurfaceImageUpload(input, {
        authorizeUpload,
        createIdempotencyKey: () => "upload-attempt-1",
      })
    ).resolves.toStrictEqual({
      reference: "opaque-upload-reference",
      uploadUrl: "https://r2.example.test/presigned",
    })
    expect(authorizeUpload).toHaveBeenCalledWith({
      headers: { "idempotency-key": "upload-attempt-1" },
      body: input,
    })
  })

  it("maps API validation and authorization problems to current upload feedback", async () => {
    const problem = (code: string) => ({
      data: { body: { code } },
    })

    await expect(
      authorizeSurfaceImageUpload(
        { surface: "edge", contentType: "image/png", contentLength: 1 },
        {
          authorizeUpload: vi
            .fn()
            .mockRejectedValue(
              problem("surface_image_upload_validation_failed")
            ),
          createIdempotencyKey: () => "attempt-1",
        }
      )
    ).resolves.toMatchObject({
      formError: "Surface Images must be JPEG, PNG, or WebP files up to 10 MB.",
    })
    await expect(
      authorizeSurfaceImageUpload(
        { surface: "edge", contentType: "image/png", contentLength: 1 },
        {
          authorizeUpload: vi
            .fn()
            .mockRejectedValue(problem("editor_access_required")),
          createIdempotencyKey: () => "attempt-2",
        }
      )
    ).resolves.toMatchObject({ formError: COIN_AUTHORIZATION_ERROR })
  })
})

describe("removeSurfaceImageUpload", () => {
  it("cancels an unsaved upload through the typed maintenance API", async () => {
    const cancelUpload = vi.fn().mockResolvedValue({ status: 204 })
    const input = {
      surface: "reverse" as const,
      reference: "opaque-upload-reference",
    }

    await expect(
      removeSurfaceImageUpload(input, { cancelUpload })
    ).resolves.toBeUndefined()
    expect(cancelUpload).toHaveBeenCalledWith({ body: input })
  })

  it("maps cancellation authorization failures to Coin Maintenance feedback", async () => {
    await expect(
      removeSurfaceImageUpload(
        { surface: "edge", reference: "opaque-upload-reference" },
        {
          cancelUpload: vi.fn().mockRejectedValue({
            data: { body: { code: "authentication_required" } },
          }),
        }
      )
    ).resolves.toMatchObject({ formError: COIN_AUTHORIZATION_ERROR })
  })
})

describe("submitUpdateCoin", () => {
  it("replaces the aggregate through the typed API with its retained ETag", async () => {
    const dependencies = createDependencies()

    await expect(
      submitUpdateCoin(
        { role: "admin" },
        {
          id: VALID_COIN_ID,
          etag: VALID_ETAG,
          ...VALID_COIN_DRAFT,
          rulers: [{ rulerId: OTHER_LOOKUP_ID }],
          compositionDescription: "  Revised material detail.  ",
          mints: [{ mintId: VALID_LOOKUP_ID }, { mintId: OTHER_LOOKUP_ID }],
          faceValueNumericValue: "2.25",
          themes: [{ themeId: OTHER_LOOKUP_ID }],
          weight: "7.5",
          diameter: "24",
          thickness: "1.9",
          mintage: "2000",
          minYear: "1999",
          maxYear: "2001",
          demonetizationStatus: "not-demonetized",
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "success",
      coinId: VALID_COIN_ID,
      message: "Saved.",
    })

    expect(dependencies.replaceCoin).toHaveBeenCalledWith({
      params: { uuid: VALID_COIN_ID },
      headers: { "if-match": VALID_ETAG },
      body: expect.objectContaining({
        title: "Spanish Test Coin",
        rulerIds: [OTHER_LOOKUP_ID],
        faceValueNumericValue: "2.25",
        mintIds: [VALID_LOOKUP_ID, OTHER_LOOKUP_ID],
        weight: "7.5",
        diameter: "24",
        surfaces: { obverse: null, reverse: null, edge: null },
      }),
    })
    expect(dependencies.updateCoinMaintenance).not.toHaveBeenCalled()
    expect(dependencies.resolveSurfaceImageUpload).not.toHaveBeenCalled()
  })

  it("passes retained image URLs and new upload references to the API", async () => {
    const dependencies = createDependencies({
      replaceCoin: vi.fn().mockResolvedValue({
        status: 200,
        headers: { etag: '"next"' },
        body: { data: { id: VALID_COIN_ID } },
      }),
    })

    await expect(
      submitUpdateCoin(
        { role: "editor" },
        {
          id: VALID_COIN_ID,
          etag: VALID_ETAG,
          ...VALID_COIN_DRAFT,
          surfaces: {
            ...VALID_COIN_DRAFT.surfaces,
            obverse: {
              description: "Portrait",
              lettering: "UNIT",
              imageUrl: "https://images.example.test/old.webp",
              imageUploadReference: "new-upload-reference",
              engraverIds: [],
            },
          },
        },
        dependencies
      )
    ).resolves.toMatchObject({
      status: "success",
      coinId: VALID_COIN_ID,
    })

    expect(dependencies.replaceCoin).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          surfaces: expect.objectContaining({
            obverse: {
              description: "Portrait",
              lettering: "UNIT",
              imageUrl: "https://images.example.test/old.webp",
              imageUploadReference: "new-upload-reference",
              engraverIds: [],
            },
          }),
        }),
      })
    )
  })

  it("asks the Collector to reload and reconcile a stale edit", async () => {
    await expect(
      submitUpdateCoin(
        { role: "editor" },
        {
          id: VALID_COIN_ID,
          etag: VALID_ETAG,
          ...VALID_COIN_DRAFT,
        },
        createDependencies({
          replaceCoin: vi.fn().mockRejectedValue({
            data: { body: { code: "coin_precondition_failed" } },
          }),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: COIN_EDIT_CONFLICT_ERROR,
    })
  })

  it("maps missing, authorization, and validation API problems", async () => {
    const submitProblem = (code: string, invalidParams?: unknown[]) =>
      submitUpdateCoin(
        { role: "editor" },
        { id: VALID_COIN_ID, etag: VALID_ETAG, ...VALID_COIN_DRAFT },
        createDependencies({
          replaceCoin: vi.fn().mockRejectedValue({
            data: { body: { code, invalidParams } },
          }),
        })
      )

    await expect(submitProblem("coin_not_found")).resolves.toMatchObject({
      formError: COIN_MISSING_ERROR,
    })
    await expect(
      submitProblem("editor_access_required")
    ).resolves.toMatchObject({ formError: COIN_AUTHORIZATION_ERROR })
    await expect(
      submitProblem("coin_validation_failed", [
        { name: "/issuerId", reason: "Issuer no longer exists." },
      ])
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: { issuerId: "Issuer no longer exists." },
    })
  })
})

describe("submitDeleteCoin", () => {
  const deleteInput = {
    id: VALID_COIN_ID,
    confirmationTitle: VALID_COIN_DRAFT.title,
  }

  it("returns an inline authorization error for signed-out or non-editor delete attempts", async () => {
    await expect(submitDeleteCoin(null, deleteInput)).resolves.toStrictEqual(
      authorizationErrorResult
    )

    await expect(
      submitDeleteCoin({ role: "collector" }, deleteInput)
    ).resolves.toStrictEqual(authorizationErrorResult)
  })

  it("maps the exact-title confirmation requirement into a field error", async () => {
    const dependencies = createDependencies({
      getCoinMaintenanceDeleteSummary: vi.fn().mockResolvedValue({
        title: VALID_COIN_DRAFT.title,
        rulerAttributions: 1,
        mintAttributions: 0,
        themeAttributions: 0,
        catalogueReferences: 0,
        coinSurfaces: 0,
        engraverAttributions: 0,
      }),
    })

    await expect(
      submitDeleteCoin(
        { role: "editor" },
        {
          ...deleteInput,
          confirmationTitle: "Spanish test coin",
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        confirmationTitle: COIN_DELETE_CONFIRMATION_ERROR,
      },
    })

    expect(dependencies.deleteCoinMaintenance).not.toHaveBeenCalled()
  })

  it("returns a missing-row form error when the delete target no longer exists", async () => {
    await expect(
      submitDeleteCoin(
        { role: "editor" },
        deleteInput,
        createDependencies({
          getCoinMaintenanceDeleteSummary: vi.fn().mockResolvedValue(null),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: COIN_MISSING_ERROR,
    })
  })

  it("returns success and the maintenance redirect when deleting a Coin", async () => {
    const dependencies = createDependencies({
      getCoinMaintenanceDeleteSummary: vi.fn().mockResolvedValue({
        title: VALID_COIN_DRAFT.title,
        rulerAttributions: 1,
        mintAttributions: 0,
        themeAttributions: 0,
        catalogueReferences: 0,
        coinSurfaces: 0,
        engraverAttributions: 0,
      }),
      deleteCoinMaintenance: vi.fn().mockResolvedValue({
        id: VALID_COIN_ID,
      }),
    })

    await expect(
      submitDeleteCoin({ role: "admin" }, deleteInput, dependencies)
    ).resolves.toStrictEqual({
      status: "success",
      message: "Coin deleted.",
      redirectTo: "/database/coins",
    })

    expect(dependencies.deleteCoinMaintenance).toHaveBeenCalledWith({
      id: VALID_COIN_ID,
    })
  })

  it("deletes only the Coin's persisted Surface Images after deleting its database aggregate", async () => {
    const events: string[] = []
    const dependencies = createDependencies({
      getCoinMaintenanceDeleteSummary: vi.fn().mockResolvedValue({
        title: VALID_COIN_DRAFT.title,
        rulerAttributions: 0,
        mintAttributions: 0,
        themeAttributions: 0,
        catalogueReferences: 0,
        coinSurfaces: 2,
        engraverAttributions: 0,
      }),
      getCoinSurfaceImageUrls: vi.fn().mockImplementation(async () => {
        events.push("read-images")
        return [
          "https://images.example.test/surface-images/opaque-obverse",
          "https://images.example.test/surface-images/opaque-edge",
        ]
      }),
      deleteCoinMaintenance: vi.fn().mockImplementation(async () => {
        events.push("delete-aggregate")
        return { id: VALID_COIN_ID }
      }),
      deleteSurfaceImage: vi.fn().mockImplementation(async (imageUrl) => {
        events.push(`delete-image:${imageUrl}`)
      }),
    })

    await expect(
      submitDeleteCoin({ role: "editor" }, deleteInput, dependencies)
    ).resolves.toMatchObject({ status: "success" })

    expect(events).toEqual([
      "read-images",
      "delete-aggregate",
      "delete-image:https://images.example.test/surface-images/opaque-obverse",
      "delete-image:https://images.example.test/surface-images/opaque-edge",
    ])
  })

  it("does not invoke storage cleanup when the deleted Coin has no Surface Images", async () => {
    const dependencies = createDependencies({
      getCoinMaintenanceDeleteSummary: vi.fn().mockResolvedValue({
        title: VALID_COIN_DRAFT.title,
        rulerAttributions: 0,
        mintAttributions: 0,
        themeAttributions: 0,
        catalogueReferences: 0,
        coinSurfaces: 0,
        engraverAttributions: 0,
      }),
      deleteCoinMaintenance: vi.fn().mockResolvedValue({ id: VALID_COIN_ID }),
    })

    await expect(
      submitDeleteCoin({ role: "editor" }, deleteInput, dependencies)
    ).resolves.toMatchObject({ status: "success" })

    expect(dependencies.deleteSurfaceImage).not.toHaveBeenCalled()
  })

  it("retains a completed Coin deletion and records Surface Image cleanup failures", async () => {
    const events: string[] = []
    const cleanupError = new Error("R2 unavailable")
    const imageUrl = "https://images.example.test/surface-images/opaque-obverse"
    const dependencies = createDependencies({
      getCoinMaintenanceDeleteSummary: vi.fn().mockResolvedValue({
        title: VALID_COIN_DRAFT.title,
        rulerAttributions: 0,
        mintAttributions: 0,
        themeAttributions: 0,
        catalogueReferences: 0,
        coinSurfaces: 1,
        engraverAttributions: 0,
      }),
      getCoinSurfaceImageUrls: vi.fn().mockResolvedValue([imageUrl]),
      deleteCoinMaintenance: vi.fn().mockImplementation(async () => {
        events.push("delete-aggregate")
        return { id: VALID_COIN_ID }
      }),
      deleteSurfaceImage: vi.fn().mockImplementation(async () => {
        events.push("delete-image")
        throw cleanupError
      }),
      recordSurfaceImageCleanupFailures: vi.fn().mockImplementation(() => {
        events.push("record-cleanup-failure")
      }),
    })

    await expect(
      submitDeleteCoin({ role: "admin" }, deleteInput, dependencies)
    ).resolves.toMatchObject({ status: "success" })

    expect(events).toEqual([
      "delete-aggregate",
      "delete-image",
      "record-cleanup-failure",
    ])
    expect(dependencies.recordSurfaceImageCleanupFailures).toHaveBeenCalledWith(
      {
        deletedCoinId: VALID_COIN_ID,
        failures: [{ imageUrl, errorMessage: "R2 unavailable" }],
      }
    )
  })
})
