import { describe, expect, it, vi } from "vitest"

import {
  hasIssuerMaintenanceAccess,
  ISSUER_AUTHORIZATION_ERROR,
  ISSUER_CHILDREN_DELETE_ERROR,
  ISSUER_COINS_DELETE_ERROR,
  ISSUER_CYCLIC_PARENT_ERROR,
  ISSUER_DUPLICATE_CODE_ERROR,
  ISSUER_GENERIC_SAVE_ERROR,
  ISSUER_INVALID_CODE_ERROR,
  ISSUER_INVALID_ISO_CODE_ERROR,
  ISSUER_MISSING_ERROR,
  ISSUER_MISSING_PARENT_ERROR,
  ISSUER_SELF_PARENT_ERROR,
  submitCreateIssuer,
  submitDeleteIssuer,
  submitUpdateIssuer,
} from "./issuer-maintenance"

const VALID_ISSUER_ID = "2c717ddb-95a2-4dad-a280-f58a4779aee8"
const VALID_PARENT_ISSUER_ID = "6f18a1db-9096-433b-b3f1-906c772f7a29"

const ARGENTINE_REPUBLIC = {
  code: "argentine-republic",
  isoCode: "AR",
  name: "Argentine Republic",
  parentIssuerId: null,
}

function createDependencies(overrides?: {
  createIssuer?: ReturnType<typeof vi.fn>
  deleteIssuer?: ReturnType<typeof vi.fn>
  updateIssuer?: ReturnType<typeof vi.fn>
}) {
  return {
    createIssuer: vi.fn(),
    deleteIssuer: vi.fn(),
    updateIssuer: vi.fn(),
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

  it("maps Zod validation issues into typed field errors", async () => {
    const dependencies = createDependencies()

    await expect(
      submitCreateIssuer(
        { role: "editor" },
        {
          code: "Argentine-Republic",
          isoCode: " ",
          name: " ",
          parentIssuerId: null,
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: ISSUER_INVALID_CODE_ERROR,
        isoCode: "Issuer ISO Code cannot be blank.",
        name: "Issuer Name cannot be blank.",
      },
    })

    expect(dependencies.createIssuer).not.toHaveBeenCalled()
  })

  it("trims Issuer fields and uppercases the ISO code before creating an Issuer", async () => {
    const dependencies = createDependencies({
      createIssuer: vi.fn().mockResolvedValue({
        id: VALID_ISSUER_ID,
      }),
    })

    await expect(
      submitCreateIssuer(
        { role: "editor" },
        {
          code: " argentine-republic ",
          isoCode: " ar ",
          name: " Argentine Republic ",
          parentIssuerId: null,
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "success",
      message: "Issuer added.",
    })

    expect(dependencies.createIssuer).toHaveBeenCalledWith({
      code: "argentine-republic",
      isoCode: "AR",
      name: "Argentine Republic",
      parentIssuerId: null,
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

  it("maps invalid Issuer Code and ISO Code constraints to their fields", async () => {
    await expect(
      submitCreateIssuer(
        { role: "admin" },
        ARGENTINE_REPUBLIC,
        createDependencies({
          createIssuer: vi
            .fn()
            .mockRejectedValueOnce({
              cause: {
                code: "23514",
                constraint_name: "issuer_code_slug_check",
              },
            })
            .mockRejectedValueOnce({
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
        code: ISSUER_INVALID_CODE_ERROR,
      },
    })

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

  it("maps missing, self, and cyclic Parent Issuer errors to the Parent Issuer field", async () => {
    const expectations = [
      {
        constraintName: "issuer_parent_issuer_id_issuer_id_fk",
        expectedError: ISSUER_MISSING_PARENT_ERROR,
        code: "23503",
      },
      {
        constraintName: "issuer_parent_issuer_id_self_check",
        expectedError: ISSUER_SELF_PARENT_ERROR,
        code: "23514",
      },
      {
        constraintName: "issuer_parent_issuer_id_cycle_check",
        expectedError: ISSUER_CYCLIC_PARENT_ERROR,
        code: "23514",
      },
    ] as const

    for (const expectation of expectations) {
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
                code: expectation.code,
                constraint_name: expectation.constraintName,
              },
            }),
          })
        )
      ).resolves.toStrictEqual({
        status: "error",
        fieldErrors: {
          parentIssuerId: expectation.expectedError,
        },
      })
    }
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

describe("submitUpdateIssuer", () => {
  const updateInput = {
    id: VALID_ISSUER_ID,
    ...ARGENTINE_REPUBLIC,
  }

  it("returns an inline authorization error for signed-out or non-editor update attempts", async () => {
    await expect(submitUpdateIssuer(null, updateInput)).resolves.toStrictEqual(
      authorizationErrorResult
    )

    await expect(
      submitUpdateIssuer({ role: "collector" }, updateInput)
    ).resolves.toStrictEqual(authorizationErrorResult)
  })

  it("trims fields and uppercases the ISO code before updating an Issuer", async () => {
    const dependencies = createDependencies({
      updateIssuer: vi.fn().mockResolvedValue({
        id: VALID_ISSUER_ID,
      }),
    })

    await expect(
      submitUpdateIssuer(
        { role: "editor" },
        {
          id: VALID_ISSUER_ID,
          code: " argentine-republic ",
          isoCode: " ar ",
          name: " Argentine Republic ",
          parentIssuerId: VALID_PARENT_ISSUER_ID,
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "success",
      message: "Saved.",
    })

    expect(dependencies.updateIssuer).toHaveBeenCalledWith({
      id: VALID_ISSUER_ID,
      code: "argentine-republic",
      isoCode: "AR",
      name: "Argentine Republic",
      parentIssuerId: VALID_PARENT_ISSUER_ID,
    })
  })

  it("returns a missing-row form error when the update target no longer exists", async () => {
    await expect(
      submitUpdateIssuer(
        { role: "editor" },
        updateInput,
        createDependencies({
          updateIssuer: vi.fn().mockResolvedValue(null),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: ISSUER_MISSING_ERROR,
    })
  })

  it("maps Parent Issuer constraint errors during update", async () => {
    const expectations = [
      {
        constraintName: "issuer_parent_issuer_id_issuer_id_fk",
        expectedError: ISSUER_MISSING_PARENT_ERROR,
        code: "23503",
      },
      {
        constraintName: "issuer_parent_issuer_id_self_check",
        expectedError: ISSUER_SELF_PARENT_ERROR,
        code: "23514",
      },
      {
        constraintName: "issuer_parent_issuer_id_cycle_check",
        expectedError: ISSUER_CYCLIC_PARENT_ERROR,
        code: "23514",
      },
    ] as const

    for (const expectation of expectations) {
      await expect(
        submitUpdateIssuer(
          { role: "admin" },
          {
            ...updateInput,
            parentIssuerId: VALID_PARENT_ISSUER_ID,
          },
          createDependencies({
            updateIssuer: vi.fn().mockRejectedValue({
              cause: {
                code: expectation.code,
                constraint_name: expectation.constraintName,
              },
            }),
          })
        )
      ).resolves.toStrictEqual({
        status: "error",
        fieldErrors: {
          parentIssuerId: expectation.expectedError,
        },
      })
    }
  })
})

describe("submitDeleteIssuer", () => {
  const deleteInput = {
    id: VALID_ISSUER_ID,
  }

  it("returns an inline authorization error for signed-out or non-editor delete attempts", async () => {
    await expect(submitDeleteIssuer(null, deleteInput)).resolves.toStrictEqual(
      authorizationErrorResult
    )

    await expect(
      submitDeleteIssuer({ role: "collector" }, deleteInput)
    ).resolves.toStrictEqual(authorizationErrorResult)
  })

  it("returns a missing-row form error when the delete target no longer exists", async () => {
    await expect(
      submitDeleteIssuer(
        { role: "editor" },
        deleteInput,
        createDependencies({
          deleteIssuer: vi.fn().mockResolvedValue(null),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: ISSUER_MISSING_ERROR,
    })
  })

  it("maps direct Coin usage and child Issuer usage delete restrictions to distinct messages", async () => {
    const expectations = [
      {
        constraintName: "coin_issuer_id_issuer_id_fk",
        expectedError: ISSUER_COINS_DELETE_ERROR,
      },
      {
        constraintName: "issuer_parent_issuer_id_issuer_id_fk",
        expectedError: ISSUER_CHILDREN_DELETE_ERROR,
      },
    ] as const

    for (const expectation of expectations) {
      await expect(
        submitDeleteIssuer(
          { role: "admin" },
          deleteInput,
          createDependencies({
            deleteIssuer: vi.fn().mockRejectedValue({
              cause: {
                code: "23001",
                constraint_name: expectation.constraintName,
              },
            }),
          })
        )
      ).resolves.toStrictEqual({
        status: "error",
        fieldErrors: {},
        formError: expectation.expectedError,
      })
    }
  })
})
