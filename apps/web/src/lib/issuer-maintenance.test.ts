import { describe, expect, it, vi } from "vitest"

import {
  ISSUER_AUTHORIZATION_ERROR,
  ISSUER_DUPLICATE_CODE_ERROR,
  ISSUER_GENERIC_SAVE_ERROR,
  ISSUER_INVALID_CODE_ERROR,
  ISSUER_INVALID_ISO_CODE_ERROR,
  ISSUER_INVALID_PARENT_ERROR,
  hasIssuerMaintenanceAccess,
  submitCreateIssuer,
} from "./issuer-maintenance"

const VALID_PARENT_ISSUER_ID = "39375b8d-3850-4447-b772-635478f4eead"

const ARGENTINE_REPUBLIC = {
  code: "argentine-republic",
  name: "Argentine Republic",
  isoCode: "AR",
  parentIssuerId: undefined,
}

function createDependencies(overrides?: {
  createIssuer?: ReturnType<typeof vi.fn>
}) {
  return {
    createIssuer: vi.fn(),
    ...overrides,
  }
}

const authorizationErrorResult = {
  status: "error" as const,
  fieldErrors: {},
  formError: ISSUER_AUTHORIZATION_ERROR,
}

describe("hasIssuerMaintenanceAccess", () => {
  it("rejects signed-out and non-editor Collectors", () => {
    expect(hasIssuerMaintenanceAccess(null)).toBe(false)
    expect(hasIssuerMaintenanceAccess({ role: "collector" })).toBe(false)
    expect(hasIssuerMaintenanceAccess({ role: null })).toBe(false)
    expect(hasIssuerMaintenanceAccess({ role: "owner" })).toBe(false)
  })

  it("allows Editors and Admins", () => {
    expect(hasIssuerMaintenanceAccess({ role: "editor" })).toBe(true)
    expect(hasIssuerMaintenanceAccess({ role: "admin" })).toBe(true)
  })
})

describe("submitCreateIssuer", () => {
  it("returns an inline authorization error for signed-out or non-editor Collectors", async () => {
    await expect(
      submitCreateIssuer(null, ARGENTINE_REPUBLIC)
    ).resolves.toStrictEqual(authorizationErrorResult)

    await expect(
      submitCreateIssuer({ role: "collector" }, ARGENTINE_REPUBLIC)
    ).resolves.toStrictEqual(authorizationErrorResult)
  })

  it("maps validation issues into typed field errors", async () => {
    const dependencies = createDependencies()

    await expect(
      submitCreateIssuer(
        { role: "editor" },
        {
          code: "Argentine Republic",
          name: " ",
          isoCode: "A1",
          parentIssuerId: "not-a-uuid",
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: ISSUER_INVALID_CODE_ERROR,
        name: "Issuer Name cannot be blank.",
        isoCode: ISSUER_INVALID_ISO_CODE_ERROR,
        parentIssuerId: "Parent Issuer must be a valid record.",
      },
    })

    expect(dependencies.createIssuer).not.toHaveBeenCalled()
  })

  it("trims fields, normalizes the Issuer ISO Code to uppercase, and preserves the selected Parent Issuer", async () => {
    const dependencies = createDependencies({
      createIssuer: vi.fn().mockResolvedValue({
        id: "3df545c0-9a2d-44f2-9d30-4bd5f4d79c3e",
      }),
    })

    await expect(
      submitCreateIssuer(
        { role: "editor" },
        {
          code: " argentine-republic ",
          name: " Argentine Republic ",
          isoCode: " ar ",
          parentIssuerId: VALID_PARENT_ISSUER_ID,
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "success",
      message: "Issuer added.",
    })

    expect(dependencies.createIssuer).toHaveBeenCalledWith({
      code: "argentine-republic",
      name: "Argentine Republic",
      isoCode: "AR",
      parentIssuerId: VALID_PARENT_ISSUER_ID,
    })
  })

  it("allows creating a root Issuer without a Parent Issuer", async () => {
    const dependencies = createDependencies({
      createIssuer: vi.fn().mockResolvedValue({
        id: "3df545c0-9a2d-44f2-9d30-4bd5f4d79c3e",
      }),
    })

    await expect(
      submitCreateIssuer(
        { role: "editor" },
        {
          code: "argentine-republic",
          name: "Argentine Republic",
          isoCode: "AR",
          parentIssuerId: "",
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "success",
      message: "Issuer added.",
    })

    expect(dependencies.createIssuer).toHaveBeenCalledWith({
      code: "argentine-republic",
      name: "Argentine Republic",
      isoCode: "AR",
      parentIssuerId: undefined,
    })
  })

  it("maps duplicate Issuer Codes to the Issuer Code field", async () => {
    await expect(
      submitCreateIssuer(
        { role: "admin" },
        ARGENTINE_REPUBLIC,
        createDependencies({
          createIssuer: vi.fn().mockRejectedValue({
            cause: {
              code: "23505",
              constraint_name: "issuer_code_unique_idx",
            },
          }),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: ISSUER_DUPLICATE_CODE_ERROR,
      },
    })
  })

  it("maps Issuer Code slug check failures to the Issuer Code field", async () => {
    await expect(
      submitCreateIssuer(
        { role: "admin" },
        ARGENTINE_REPUBLIC,
        createDependencies({
          createIssuer: vi.fn().mockRejectedValue({
            cause: {
              code: "23514",
              constraint_name: "issuer_code_slug_check",
            },
          }),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: ISSUER_INVALID_CODE_ERROR,
      },
    })
  })

  it("maps Issuer ISO Code format check failures to the Issuer ISO Code field", async () => {
    await expect(
      submitCreateIssuer(
        { role: "admin" },
        ARGENTINE_REPUBLIC,
        createDependencies({
          createIssuer: vi.fn().mockRejectedValue({
            cause: {
              code: "23514",
              constraint_name: "issuer_iso_code_format_check",
            },
          }),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        isoCode: ISSUER_INVALID_ISO_CODE_ERROR,
      },
    })
  })

  it("maps invalid Parent Issuer references to the Parent Issuer field", async () => {
    await expect(
      submitCreateIssuer(
        { role: "admin" },
        {
          ...ARGENTINE_REPUBLIC,
          parentIssuerId: VALID_PARENT_ISSUER_ID,
        },
        createDependencies({
          createIssuer: vi.fn().mockRejectedValue({
            cause: {
              code: "23503",
              constraint_name: "issuer_parent_issuer_id_issuer_id_fk",
            },
          }),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        parentIssuerId: ISSUER_INVALID_PARENT_ERROR,
      },
    })
  })

  it("returns a generic form error for unexpected persistence failures", async () => {
    await expect(
      submitCreateIssuer(
        { role: "admin" },
        ARGENTINE_REPUBLIC,
        createDependencies({
          createIssuer: vi.fn().mockRejectedValue(new Error("boom")),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: ISSUER_GENERIC_SAVE_ERROR,
    })
  })
})
