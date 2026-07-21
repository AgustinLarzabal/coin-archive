import { describe, expect, it, vi } from "vitest"

import {
  authorizeSurfaceImageUpload,
  COIN_AUTHORIZATION_ERROR,
  COIN_DELETE_CONFIRMATION_ERROR,
  COIN_MISSING_ERROR,
  hasCoinMaintenanceAccess,
  submitCreateCoin,
  submitDeleteCoin,
  submitUpdateCoin,
} from "./actions"
import type { CoinDraft } from "./actions"

const VALID_COIN_ID = "2c717ddb-95a2-4dad-a280-f58a4779aee8"
const VALID_LOOKUP_ID = "6f18a1db-9096-433b-b3f1-906c772f7a29"
const OTHER_LOOKUP_ID = "de2dcfb7-dc50-4035-8bc8-33cbbacb586b"

const VALID_COIN_DRAFT: CoinDraft = {
  title: "Spanish Test Coin",
  issuerId: VALID_LOOKUP_ID,
  rulers: [{ rulerId: VALID_LOOKUP_ID }],
  distributionId: VALID_LOOKUP_ID,
  compositionId: VALID_LOOKUP_ID,
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
  createCoinMaintenance?: ReturnType<typeof vi.fn>
  deleteCoinMaintenance?: ReturnType<typeof vi.fn>
  getCoinMaintenanceDeleteSummary?: ReturnType<typeof vi.fn>
  updateCoinMaintenance?: ReturnType<typeof vi.fn>
  resolveSurfaceImageUpload?: ReturnType<typeof vi.fn>
}) {
  return {
    createCoinMaintenance: vi.fn(),
    deleteCoinMaintenance: vi.fn(),
    getCoinMaintenanceDeleteSummary: vi.fn(),
    updateCoinMaintenance: vi.fn(),
    resolveSurfaceImageUpload: vi.fn(),
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
    await expect(submitCreateCoin(null, VALID_COIN_DRAFT)).resolves.toStrictEqual(
      authorizationErrorResult
    )

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
        faceValueNumericValue: "Face Value numeric value must be greater than 0.",
        minYear: "Issue Year Range requires both years or neither year.",
        maxYear: "Issue Year Range requires both years or neither year.",
      },
    })

    expect(dependencies.createCoinMaintenance).not.toHaveBeenCalled()
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

    expect(dependencies.createCoinMaintenance).not.toHaveBeenCalled()
  })

  it("normalizes blank optional scalars and maps aggregate child collections before creating a Coin", async () => {
    const dependencies = createDependencies({
      createCoinMaintenance: vi.fn().mockResolvedValue({
        id: VALID_COIN_ID,
      }),
    })

    await expect(
      submitCreateCoin(
        { role: "editor" },
        {
          ...VALID_COIN_DRAFT,
          title: "  Spanish Test Coin  ",
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

    expect(dependencies.createCoinMaintenance).toHaveBeenCalledWith({
      title: "Spanish Test Coin",
      issuerId: VALID_LOOKUP_ID,
      rulerIds: [VALID_LOOKUP_ID],
      distributionId: VALID_LOOKUP_ID,
      compositionId: VALID_LOOKUP_ID,
      faceValueText: "1 Test Unit",
      faceValueNumericValue: 1.5,
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
    })
  })

  it("resolves only the authorized Surface Image reference before persisting the Coin aggregate", async () => {
    const dependencies = createDependencies({
      createCoinMaintenance: vi.fn().mockResolvedValue({ id: VALID_COIN_ID }),
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

    expect(dependencies.resolveSurfaceImageUpload).toHaveBeenCalledWith(
      "opaque-upload-reference",
      "obverse"
    )
    expect(dependencies.createCoinMaintenance).toHaveBeenCalledWith(
      expect.objectContaining({
        surfaces: {
          obverse: expect.objectContaining({
            imageUrl: "https://images.example.test/surface-images/opaque-id",
          }),
          reverse: null,
          edge: null,
        },
      })
    )
  })

  it("does not persist a Coin when its authorized Surface Image cannot pass server inspection", async () => {
    const dependencies = createDependencies({
      resolveSurfaceImageUpload: vi
        .fn()
        .mockRejectedValue(new Error("invalid object")),
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
    expect(dependencies.createCoinMaintenance).not.toHaveBeenCalled()
  })
})

describe("authorizeSurfaceImageUpload", () => {
  it("uses established Coin Maintenance authorization before issuing an upload URL", async () => {
    const authorizeUpload = vi.fn()
    const input = { surface: "obverse" as const, contentType: "image/jpeg", contentLength: 100 }

    await expect(
      authorizeSurfaceImageUpload(null, input, { authorizeUpload })
    ).resolves.toStrictEqual(authorizationErrorResult)
    expect(authorizeUpload).not.toHaveBeenCalled()

    authorizeUpload.mockResolvedValue({
      reference: "opaque-upload-reference",
      uploadUrl: "https://r2.example.test/presigned",
    })
    await expect(
      authorizeSurfaceImageUpload({ role: "admin" }, input, { authorizeUpload })
    ).resolves.toStrictEqual({
      reference: "opaque-upload-reference",
      uploadUrl: "https://r2.example.test/presigned",
    })
  })
})

describe("submitUpdateCoin", () => {
  it("returns a missing-row form error when the update target no longer exists", async () => {
    await expect(
      submitUpdateCoin(
        { role: "editor" },
        {
          id: VALID_COIN_ID,
          ...VALID_COIN_DRAFT,
        },
        createDependencies({
          updateCoinMaintenance: vi.fn().mockResolvedValue(null),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: COIN_MISSING_ERROR,
    })
  })

  it("passes normalized edit fields through to the persistence layer and returns the saved Coin id", async () => {
    const dependencies = createDependencies({
      updateCoinMaintenance: vi.fn().mockResolvedValue({
        id: VALID_COIN_ID,
      }),
    })

    await expect(
      submitUpdateCoin(
        { role: "admin" },
        {
          id: VALID_COIN_ID,
          ...VALID_COIN_DRAFT,
          rulers: [{ rulerId: OTHER_LOOKUP_ID }],
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

    expect(dependencies.updateCoinMaintenance).toHaveBeenCalledWith({
      id: VALID_COIN_ID,
      title: "Spanish Test Coin",
      issuerId: VALID_LOOKUP_ID,
      rulerIds: [OTHER_LOOKUP_ID],
      distributionId: VALID_LOOKUP_ID,
      compositionId: VALID_LOOKUP_ID,
      faceValueText: "1 Test Unit",
      faceValueNumericValue: 2.25,
      currencyId: VALID_LOOKUP_ID,
      mintIds: [VALID_LOOKUP_ID, OTHER_LOOKUP_ID],
      orientationId: null,
      shapeId: null,
      techniqueId: null,
      edgeId: null,
      rimId: null,
      themeIds: [OTHER_LOOKUP_ID],
      weight: 7.5,
      diameter: 24,
      thickness: 1.9,
      mintage: 2000,
      comments: null,
      minYear: 1999,
      maxYear: 2001,
      isDemonetized: false,
      references: [],
      surfaces: {
        obverse: null,
        reverse: null,
        edge: null,
      },
    })
  })

  it("passes structured Catalogue References and Surface Set details through to persistence", async () => {
    const dependencies = createDependencies({
      updateCoinMaintenance: vi.fn().mockResolvedValue({
        id: VALID_COIN_ID,
      }),
    })

    await expect(
      submitUpdateCoin(
        { role: "editor" },
        {
          id: VALID_COIN_ID,
          ...VALID_COIN_DRAFT,
          references: [
            {
              catalogueId: VALID_LOOKUP_ID,
              number: " KM 25 ",
            },
          ],
          surfaces: {
            obverse: {
              description: " Laureate bust ",
              lettering: " HISPAN ",
              imageUrl: "https://example.com/obverse.jpg",
              engraverIds: [VALID_LOOKUP_ID],
            },
            reverse: {
              description: "",
              lettering: "",
              imageUrl: "",
              engraverIds: [],
            },
            edge: {
              description: " Reeded ",
              lettering: "",
              imageUrl: "https://example.com/edge.jpg",
            },
          },
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "success",
      coinId: VALID_COIN_ID,
      message: "Saved.",
    })

    expect(dependencies.updateCoinMaintenance).toHaveBeenCalledWith({
      id: VALID_COIN_ID,
      title: "Spanish Test Coin",
      issuerId: VALID_LOOKUP_ID,
      rulerIds: [VALID_LOOKUP_ID],
      distributionId: VALID_LOOKUP_ID,
      compositionId: VALID_LOOKUP_ID,
      faceValueText: "1 Test Unit",
      faceValueNumericValue: 1.5,
      currencyId: VALID_LOOKUP_ID,
      mintIds: [],
      orientationId: null,
      shapeId: null,
      techniqueId: null,
      edgeId: null,
      rimId: null,
      themeIds: [],
      weight: null,
      diameter: null,
      thickness: null,
      mintage: null,
      comments: null,
      minYear: null,
      maxYear: null,
      isDemonetized: null,
      references: [
        {
          catalogueId: VALID_LOOKUP_ID,
          number: "KM 25",
        },
      ],
      surfaces: {
        obverse: {
          description: "Laureate bust",
          lettering: "HISPAN",
          imageUrl: "https://example.com/obverse.jpg",
          engraverIds: [VALID_LOOKUP_ID],
        },
        reverse: null,
        edge: {
          description: "Reeded",
          lettering: null,
          imageUrl: "https://example.com/edge.jpg",
        },
      },
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
})
