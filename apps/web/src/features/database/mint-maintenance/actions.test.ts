import { describe, expect, it, vi } from "vitest"

import {
  MINT_AUTHORIZATION_ERROR,
  hasMintMaintenanceAccess,
  submitCreateMint,
  submitDeleteMint,
  submitUpdateMint,
} from "./actions"
import {
  MINT_DUPLICATE_CODE_ERROR,
  MINT_GENERIC_SAVE_ERROR,
  MINT_IN_USE_DELETE_ERROR,
  MINT_INVALID_CODE_ERROR,
  MINT_MISSING_ERROR,
} from "./mint-mutation-errors"

const VALID_MINT_ID = "2c717ddb-95a2-4dad-a280-f58a4779aee8"
const BUENOS_AIRES_MINT = {
  code: "buenos-aires-mint",
  name: "Buenos Aires Mint",
}

function createDependencies(overrides?: {
  createMint?: ReturnType<typeof vi.fn>
  deleteMint?: ReturnType<typeof vi.fn>
  updateMint?: ReturnType<typeof vi.fn>
}) {
  return {
    createMint: vi.fn(),
    deleteMint: vi.fn(),
    updateMint: vi.fn(),
    ...overrides,
  }
}

const authorizationErrorResult = {
  status: "error" as const,
  fieldErrors: {},
  formError: MINT_AUTHORIZATION_ERROR,
}

describe("hasMintMaintenanceAccess", () => {
  it("rejects signed-out and non-editor Collectors", () => {
    expect(hasMintMaintenanceAccess(null)).toBe(false)
    expect(hasMintMaintenanceAccess({ role: "collector" })).toBe(false)
    expect(hasMintMaintenanceAccess({ role: null })).toBe(false)
    expect(hasMintMaintenanceAccess({ role: "owner" })).toBe(false)
  })

  it("allows Editors and Admins", () => {
    expect(hasMintMaintenanceAccess({ role: "editor" })).toBe(true)
    expect(hasMintMaintenanceAccess({ role: "admin" })).toBe(true)
  })
})

describe("submitCreateMint", () => {
  it("returns an inline authorization error for signed-out or non-editor Collectors", async () => {
    await expect(
      submitCreateMint(null, BUENOS_AIRES_MINT)
    ).resolves.toStrictEqual(authorizationErrorResult)

    await expect(
      submitCreateMint({ role: "collector" }, BUENOS_AIRES_MINT)
    ).resolves.toStrictEqual(authorizationErrorResult)
  })

  it("maps Zod validation issues into typed field errors", async () => {
    const dependencies = createDependencies()

    await expect(
      submitCreateMint(
        { role: "editor" },
        {
          code: "Buenos-Aires-Mint",
          name: " ",
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: MINT_INVALID_CODE_ERROR,
        name: "Mint Name cannot be blank.",
      },
    })

    expect(dependencies.createMint).not.toHaveBeenCalled()
  })

  it("trims Mint fields before creating a Mint", async () => {
    const dependencies = createDependencies({
      createMint: vi.fn().mockResolvedValue({
        id: "6f18a1db-9096-433b-b3f1-906c772f7a29",
      }),
    })

    await expect(
      submitCreateMint(
        { role: "editor" },
        {
          code: " buenos-aires-mint ",
          name: " Buenos Aires Mint ",
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "success",
      message: "Mint added.",
    })

    expect(dependencies.createMint).toHaveBeenCalledWith({
      code: "buenos-aires-mint",
      name: "Buenos Aires Mint",
    })
  })

  it("maps duplicate Mint Codes to the Mint Code field", async () => {
    await expect(
      submitCreateMint(
        { role: "admin" },
        BUENOS_AIRES_MINT,
        createDependencies({
          createMint: vi.fn().mockRejectedValue({
            cause: {
              code: "23505",
              constraint_name: "mint_code_lower_unique_idx",
            },
          }),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: MINT_DUPLICATE_CODE_ERROR,
      },
    })
  })

  it("maps Mint Code slug check failures to the Mint Code field", async () => {
    await expect(
      submitCreateMint(
        { role: "admin" },
        BUENOS_AIRES_MINT,
        createDependencies({
          createMint: vi.fn().mockRejectedValue({
            cause: {
              code: "23514",
              constraint_name: "mint_code_slug_check",
            },
          }),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: MINT_INVALID_CODE_ERROR,
      },
    })
  })

  it("returns a success result for valid create submissions", async () => {
    const dependencies = createDependencies({
      createMint: vi.fn().mockResolvedValue({
        id: "6f18a1db-9096-433b-b3f1-906c772f7a29",
      }),
    })

    await expect(
      submitCreateMint({ role: "editor" }, BUENOS_AIRES_MINT, dependencies)
    ).resolves.toStrictEqual({
      status: "success",
      message: "Mint added.",
    })

    expect(dependencies.createMint).toHaveBeenCalledWith(BUENOS_AIRES_MINT)
  })

  it("returns a generic form error for unexpected persistence failures", async () => {
    await expect(
      submitCreateMint(
        { role: "admin" },
        BUENOS_AIRES_MINT,
        createDependencies({
          createMint: vi.fn().mockRejectedValue(new Error("boom")),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: MINT_GENERIC_SAVE_ERROR,
    })
  })
})

describe("submitUpdateMint", () => {
  const updateInput = {
    id: VALID_MINT_ID,
    ...BUENOS_AIRES_MINT,
  }

  it("returns an inline authorization error for signed-out or non-editor update attempts", async () => {
    await expect(submitUpdateMint(null, updateInput)).resolves.toStrictEqual(
      authorizationErrorResult
    )

    await expect(
      submitUpdateMint({ role: "collector" }, updateInput)
    ).resolves.toStrictEqual(authorizationErrorResult)
  })

  it("maps Zod update validation issues into typed field errors", async () => {
    const dependencies = createDependencies()

    await expect(
      submitUpdateMint(
        { role: "editor" },
        {
          id: VALID_MINT_ID,
          code: "Buenos-Aires-Mint",
          name: " ",
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: MINT_INVALID_CODE_ERROR,
        name: "Mint Name cannot be blank.",
      },
    })

    expect(dependencies.updateMint).not.toHaveBeenCalled()
  })

  it("trims Mint fields before updating a Mint", async () => {
    const dependencies = createDependencies({
      updateMint: vi.fn().mockResolvedValue({
        id: VALID_MINT_ID,
      }),
    })

    await expect(
      submitUpdateMint(
        { role: "editor" },
        {
          id: VALID_MINT_ID,
          code: " buenos-aires-mint ",
          name: " Buenos Aires Mint ",
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "success",
      message: "Saved.",
    })

    expect(dependencies.updateMint).toHaveBeenCalledWith({
      id: VALID_MINT_ID,
      code: "buenos-aires-mint",
      name: "Buenos Aires Mint",
    })
  })

  it("returns a missing-row form error when the update target no longer exists", async () => {
    await expect(
      submitUpdateMint(
        { role: "editor" },
        updateInput,
        createDependencies({
          updateMint: vi.fn().mockResolvedValue(null),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: MINT_MISSING_ERROR,
    })
  })

  it("maps duplicate Mint Codes to the Mint Code field during update", async () => {
    await expect(
      submitUpdateMint(
        { role: "admin" },
        updateInput,
        createDependencies({
          updateMint: vi.fn().mockRejectedValue({
            cause: {
              code: "23505",
              constraint_name: "mint_code_lower_unique_idx",
            },
          }),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: MINT_DUPLICATE_CODE_ERROR,
      },
    })
  })

  it("maps Mint Code slug check failures to the Mint Code field during update", async () => {
    await expect(
      submitUpdateMint(
        { role: "admin" },
        updateInput,
        createDependencies({
          updateMint: vi.fn().mockRejectedValue({
            cause: {
              code: "23514",
              constraint_name: "mint_code_slug_check",
            },
          }),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: MINT_INVALID_CODE_ERROR,
      },
    })
  })

  it("returns a generic form error for unexpected update persistence failures", async () => {
    await expect(
      submitUpdateMint(
        { role: "admin" },
        updateInput,
        createDependencies({
          updateMint: vi.fn().mockRejectedValue(new Error("boom")),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: MINT_GENERIC_SAVE_ERROR,
    })
  })

  it("returns a success result for valid update submissions", async () => {
    const dependencies = createDependencies({
      updateMint: vi.fn().mockResolvedValue({
        id: VALID_MINT_ID,
      }),
    })

    await expect(
      submitUpdateMint({ role: "admin" }, updateInput, dependencies)
    ).resolves.toStrictEqual({
      status: "success",
      message: "Saved.",
    })

    expect(dependencies.updateMint).toHaveBeenCalledWith(updateInput)
  })
})

describe("submitDeleteMint", () => {
  const deleteInput = {
    id: VALID_MINT_ID,
  }

  it("returns an inline authorization error for signed-out or non-editor delete attempts", async () => {
    await expect(submitDeleteMint(null, deleteInput)).resolves.toStrictEqual(
      authorizationErrorResult
    )

    await expect(
      submitDeleteMint({ role: "collector" }, deleteInput)
    ).resolves.toStrictEqual(authorizationErrorResult)
  })

  it("rejects invalid delete payloads before hitting persistence", async () => {
    const dependencies = createDependencies()

    await expect(
      submitDeleteMint(
        { role: "editor" },
        {
          id: "not-a-uuid",
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
    })

    expect(dependencies.deleteMint).not.toHaveBeenCalled()
  })

  it("returns a missing-row form error when the delete target no longer exists", async () => {
    await expect(
      submitDeleteMint(
        { role: "admin" },
        deleteInput,
        createDependencies({
          deleteMint: vi.fn().mockResolvedValue(null),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: MINT_MISSING_ERROR,
    })
  })

  it("maps referenced-Mint delete failures to the Mint-specific form error", async () => {
    await expect(
      submitDeleteMint(
        { role: "admin" },
        deleteInput,
        createDependencies({
          deleteMint: vi.fn().mockRejectedValue({
            cause: {
              code: "23001",
              constraint_name: "coin_mint_mint_id_mint_id_fk",
            },
          }),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: MINT_IN_USE_DELETE_ERROR,
    })
  })

  it("returns a generic form error for unexpected delete persistence failures", async () => {
    await expect(
      submitDeleteMint(
        { role: "editor" },
        deleteInput,
        createDependencies({
          deleteMint: vi.fn().mockRejectedValue(new Error("boom")),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: MINT_GENERIC_SAVE_ERROR,
    })
  })

  it("returns a success result for valid delete submissions", async () => {
    const dependencies = createDependencies({
      deleteMint: vi.fn().mockResolvedValue({
        id: VALID_MINT_ID,
      }),
    })

    await expect(
      submitDeleteMint({ role: "editor" }, deleteInput, dependencies)
    ).resolves.toStrictEqual({
      status: "success",
      message: "Mint deleted.",
    })

    expect(dependencies.deleteMint).toHaveBeenCalledWith(deleteInput)
  })
})
