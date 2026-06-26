import { describe, expect, it, vi } from "vitest"

import {
  DISTRIBUTION_AUTHORIZATION_ERROR,
  DISTRIBUTION_DUPLICATE_CODE_ERROR,
  DISTRIBUTION_GENERIC_SAVE_ERROR,
  DISTRIBUTION_INVALID_CODE_ERROR,
  hasDistributionMaintenanceAccess,
  submitCreateDistribution,
} from "./distribution-maintenance"

const STANDARD_CIRCULATION = {
  code: "standard-circulation",
  name: "Standard circulation",
}

function createDependencies(overrides?: {
  createDistribution?: ReturnType<typeof vi.fn>
}) {
  return {
    createDistribution: vi.fn(),
    ...overrides,
  }
}

const authorizationErrorResult = {
  status: "error" as const,
  fieldErrors: {},
  formError: DISTRIBUTION_AUTHORIZATION_ERROR,
}

describe("hasDistributionMaintenanceAccess", () => {
  it("rejects signed-out and non-editor Collectors", () => {
    expect(hasDistributionMaintenanceAccess(null)).toBe(false)
    expect(hasDistributionMaintenanceAccess({ role: "collector" })).toBe(false)
    expect(hasDistributionMaintenanceAccess({ role: null })).toBe(false)
    expect(hasDistributionMaintenanceAccess({ role: "owner" })).toBe(false)
  })

  it("allows Editors and Admins", () => {
    expect(hasDistributionMaintenanceAccess({ role: "editor" })).toBe(true)
    expect(hasDistributionMaintenanceAccess({ role: "admin" })).toBe(true)
  })
})

describe("submitCreateDistribution", () => {
  it("returns an inline authorization error for signed-out or non-editor Collectors", async () => {
    await expect(
      submitCreateDistribution(null, STANDARD_CIRCULATION)
    ).resolves.toStrictEqual(authorizationErrorResult)

    await expect(
      submitCreateDistribution({ role: "collector" }, STANDARD_CIRCULATION)
    ).resolves.toStrictEqual(authorizationErrorResult)
  })

  it("maps Zod validation issues into typed field errors", async () => {
    const dependencies = createDependencies()

    await expect(
      submitCreateDistribution(
        { role: "editor" },
        {
          code: "Standard Circulation",
          name: " ",
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: DISTRIBUTION_INVALID_CODE_ERROR,
        name: "Distribution Name cannot be blank.",
      },
    })

    expect(dependencies.createDistribution).not.toHaveBeenCalled()
  })

  it("trims Distribution fields before creating a Distribution", async () => {
    const dependencies = createDependencies({
      createDistribution: vi.fn().mockResolvedValue({
        id: "6f18a1db-9096-433b-b3f1-906c772f7a29",
      }),
    })

    await expect(
      submitCreateDistribution(
        { role: "editor" },
        {
          code: " standard-circulation ",
          name: " Standard circulation ",
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "success",
      message: "Distribution added.",
    })

    expect(dependencies.createDistribution).toHaveBeenCalledWith({
      code: "standard-circulation",
      name: "Standard circulation",
    })
  })

  it("maps duplicate Distribution Codes to the Distribution Code field", async () => {
    await expect(
      submitCreateDistribution(
        { role: "admin" },
        STANDARD_CIRCULATION,
        createDependencies({
          createDistribution: vi.fn().mockRejectedValue({
            cause: {
              code: "23505",
              constraint_name: "distribution_code_lower_unique_idx",
            },
          }),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: DISTRIBUTION_DUPLICATE_CODE_ERROR,
      },
    })
  })

  it("maps Distribution Code slug check failures to the Distribution Code field", async () => {
    await expect(
      submitCreateDistribution(
        { role: "admin" },
        STANDARD_CIRCULATION,
        createDependencies({
          createDistribution: vi.fn().mockRejectedValue({
            cause: {
              code: "23514",
              constraint_name: "distribution_code_slug_check",
            },
          }),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: DISTRIBUTION_INVALID_CODE_ERROR,
      },
    })
  })

  it("returns a success result for valid create submissions", async () => {
    const dependencies = createDependencies({
      createDistribution: vi.fn().mockResolvedValue({
        id: "6f18a1db-9096-433b-b3f1-906c772f7a29",
      }),
    })

    await expect(
      submitCreateDistribution(
        { role: "editor" },
        STANDARD_CIRCULATION,
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "success",
      message: "Distribution added.",
    })

    expect(dependencies.createDistribution).toHaveBeenCalledWith(
      STANDARD_CIRCULATION
    )
  })

  it("returns a generic form error for unexpected persistence failures", async () => {
    await expect(
      submitCreateDistribution(
        { role: "admin" },
        STANDARD_CIRCULATION,
        createDependencies({
          createDistribution: vi.fn().mockRejectedValue(new Error("boom")),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: DISTRIBUTION_GENERIC_SAVE_ERROR,
    })
  })
})
