import { describe, expect, it, vi } from "vitest"

import {
  COIN_AUTHORIZATION_ERROR,
  COIN_MISSING_ERROR,
  hasCoinMaintenanceAccess,
  submitCreateCoin,
  submitUpdateCoin,
} from "./actions"

const VALID_COIN_ID = "2c717ddb-95a2-4dad-a280-f58a4779aee8"
const VALID_LOOKUP_ID = "6f18a1db-9096-433b-b3f1-906c772f7a29"
const OTHER_LOOKUP_ID = "de2dcfb7-dc50-4035-8bc8-33cbbacb586b"

const VALID_COIN_DRAFT = {
  title: "Spanish Test Coin",
  issuerId: VALID_LOOKUP_ID,
  rulerId: VALID_LOOKUP_ID,
  distributionId: VALID_LOOKUP_ID,
  compositionId: VALID_LOOKUP_ID,
  faceValueText: "1 Test Unit",
  faceValueNumericValue: "1.5",
  currencyId: VALID_LOOKUP_ID,
  orientationId: "",
  shapeId: "",
  techniqueId: "",
  edgeId: "",
  rimId: "",
  weight: "",
  diameter: "",
  thickness: "",
  mintage: "",
  comments: "",
  minYear: "",
  maxYear: "",
  demonetizationStatus: "unknown",
} as const

function createDependencies(overrides?: {
  createCoinMaintenance?: ReturnType<typeof vi.fn>
  updateCoinMaintenance?: ReturnType<typeof vi.fn>
}) {
  return {
    createCoinMaintenance: vi.fn(),
    updateCoinMaintenance: vi.fn(),
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
        faceValueNumericValue: "Face Value numeric value must be greater than 0.",
        minYear: "Issue Year Range requires both years or neither year.",
        maxYear: "Issue Year Range requires both years or neither year.",
      },
    })

    expect(dependencies.createCoinMaintenance).not.toHaveBeenCalled()
  })

  it("normalizes blank optional scalars to null and maps demonetization status before creating a Coin", async () => {
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
      rulerId: VALID_LOOKUP_ID,
      distributionId: VALID_LOOKUP_ID,
      compositionId: VALID_LOOKUP_ID,
      faceValueText: "1 Test Unit",
      faceValueNumericValue: 1.5,
      currencyId: VALID_LOOKUP_ID,
      orientationId: null,
      shapeId: null,
      techniqueId: null,
      edgeId: null,
      rimId: null,
      weight: null,
      diameter: null,
      thickness: null,
      mintage: null,
      comments: "Public note.",
      minYear: null,
      maxYear: null,
      isDemonetized: true,
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
          rulerId: OTHER_LOOKUP_ID,
          faceValueNumericValue: "2.25",
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
      rulerId: OTHER_LOOKUP_ID,
      distributionId: VALID_LOOKUP_ID,
      compositionId: VALID_LOOKUP_ID,
      faceValueText: "1 Test Unit",
      faceValueNumericValue: 2.25,
      currencyId: VALID_LOOKUP_ID,
      orientationId: null,
      shapeId: null,
      techniqueId: null,
      edgeId: null,
      rimId: null,
      weight: 7.5,
      diameter: 24,
      thickness: 1.9,
      mintage: 2000,
      comments: null,
      minYear: 1999,
      maxYear: 2001,
      isDemonetized: false,
    })
  })
})
