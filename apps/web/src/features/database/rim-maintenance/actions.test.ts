import { describe, expect, it, vi } from "vitest"

import {
  RIM_AUTHORIZATION_ERROR,
  RIM_DUPLICATE_CODE_ERROR,
  RIM_GENERIC_SAVE_ERROR,
  RIM_IN_USE_DELETE_ERROR,
  RIM_INVALID_CODE_ERROR,
  RIM_MISSING_ERROR,
  hasRimMaintenanceAccess,
  submitCreateRim,
  submitDeleteRim,
  submitUpdateRim,
} from "./actions"

const VALID_RIM_ID = "2c717ddb-95a2-4dad-a280-f58a4779aee8"
const RAISED_RIM = {
  code: "raised",
  name: "Raised rim",
}

function createDependencies(overrides?: {
  createRim?: ReturnType<typeof vi.fn>
  deleteRim?: ReturnType<typeof vi.fn>
  updateRim?: ReturnType<typeof vi.fn>
}) {
  return {
    createRim: vi.fn(),
    deleteRim: vi.fn(),
    updateRim: vi.fn(),
    ...overrides,
  }
}

const authorizationErrorResult = {
  status: "error" as const,
  fieldErrors: {},
  formError: RIM_AUTHORIZATION_ERROR,
}

describe("hasRimMaintenanceAccess", () => {
  it("rejects signed-out and non-editor Collectors", () => {
    expect(hasRimMaintenanceAccess(null)).toBe(false)
    expect(hasRimMaintenanceAccess({ role: "collector" })).toBe(false)
    expect(hasRimMaintenanceAccess({ role: null })).toBe(false)
    expect(hasRimMaintenanceAccess({ role: "owner" })).toBe(false)
  })

  it("allows Editors and Admins", () => {
    expect(hasRimMaintenanceAccess({ role: "editor" })).toBe(true)
    expect(hasRimMaintenanceAccess({ role: "admin" })).toBe(true)
  })
})

describe("submitCreateRim", () => {
  it("returns an inline authorization error for signed-out or non-editor Collectors", async () => {
    await expect(submitCreateRim(null, RAISED_RIM)).resolves.toStrictEqual(
      authorizationErrorResult
    )

    await expect(
      submitCreateRim({ role: "collector" }, RAISED_RIM)
    ).resolves.toStrictEqual(authorizationErrorResult)
  })

  it("maps Zod validation issues into typed field errors", async () => {
    const dependencies = createDependencies()

    await expect(
      submitCreateRim(
        { role: "editor" },
        {
          code: "Raised",
          name: " ",
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: RIM_INVALID_CODE_ERROR,
        name: "Rim Name cannot be blank.",
      },
    })

    expect(dependencies.createRim).not.toHaveBeenCalled()
  })

  it("trims Rim fields before creating a Rim", async () => {
    const dependencies = createDependencies({
      createRim: vi.fn().mockResolvedValue({
        id: "6f18a1db-9096-433b-b3f1-906c772f7a29",
      }),
    })

    await expect(
      submitCreateRim(
        { role: "editor" },
        {
          code: " raised ",
          name: " Raised rim ",
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "success",
      message: "Rim added.",
    })

    expect(dependencies.createRim).toHaveBeenCalledWith({
      code: "raised",
      name: "Raised rim",
    })
  })

  it("maps duplicate Rim Codes to the Rim Code field", async () => {
    await expect(
      submitCreateRim(
        { role: "admin" },
        RAISED_RIM,
        createDependencies({
          createRim: vi.fn().mockRejectedValue({
            cause: {
              code: "23505",
              constraint_name: "rim_code_lower_unique_idx",
            },
          }),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: RIM_DUPLICATE_CODE_ERROR,
      },
    })
  })

  it("maps Rim Code slug check failures to the Rim Code field", async () => {
    await expect(
      submitCreateRim(
        { role: "admin" },
        RAISED_RIM,
        createDependencies({
          createRim: vi.fn().mockRejectedValue({
            cause: {
              code: "23514",
              constraint_name: "rim_code_slug_check",
            },
          }),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: RIM_INVALID_CODE_ERROR,
      },
    })
  })

  it("returns a success result for valid create submissions", async () => {
    const dependencies = createDependencies({
      createRim: vi.fn().mockResolvedValue({
        id: "6f18a1db-9096-433b-b3f1-906c772f7a29",
      }),
    })

    await expect(
      submitCreateRim({ role: "editor" }, RAISED_RIM, dependencies)
    ).resolves.toStrictEqual({
      status: "success",
      message: "Rim added.",
    })

    expect(dependencies.createRim).toHaveBeenCalledWith(RAISED_RIM)
  })

  it("returns a generic form error for unexpected persistence failures", async () => {
    await expect(
      submitCreateRim(
        { role: "admin" },
        RAISED_RIM,
        createDependencies({
          createRim: vi.fn().mockRejectedValue(new Error("boom")),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: RIM_GENERIC_SAVE_ERROR,
    })
  })
})

describe("submitUpdateRim", () => {
  const updateInput = {
    id: VALID_RIM_ID,
    ...RAISED_RIM,
  }

  it("returns an inline authorization error for signed-out or non-editor update attempts", async () => {
    await expect(submitUpdateRim(null, updateInput)).resolves.toStrictEqual(
      authorizationErrorResult
    )

    await expect(
      submitUpdateRim({ role: "collector" }, updateInput)
    ).resolves.toStrictEqual(authorizationErrorResult)
  })

  it("maps Zod update validation issues into typed field errors", async () => {
    const dependencies = createDependencies()

    await expect(
      submitUpdateRim(
        { role: "editor" },
        {
          id: VALID_RIM_ID,
          code: "Raised",
          name: " ",
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: RIM_INVALID_CODE_ERROR,
        name: "Rim Name cannot be blank.",
      },
    })

    expect(dependencies.updateRim).not.toHaveBeenCalled()
  })

  it("trims Rim fields before updating a Rim", async () => {
    const dependencies = createDependencies({
      updateRim: vi.fn().mockResolvedValue({
        id: VALID_RIM_ID,
      }),
    })

    await expect(
      submitUpdateRim(
        { role: "editor" },
        {
          id: VALID_RIM_ID,
          code: " raised ",
          name: " Raised rim ",
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "success",
      message: "Saved.",
    })

    expect(dependencies.updateRim).toHaveBeenCalledWith({
      id: VALID_RIM_ID,
      code: "raised",
      name: "Raised rim",
    })
  })

  it("returns a missing-row form error when the update target no longer exists", async () => {
    await expect(
      submitUpdateRim(
        { role: "editor" },
        updateInput,
        createDependencies({
          updateRim: vi.fn().mockResolvedValue(null),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: RIM_MISSING_ERROR,
    })
  })

  it("maps duplicate Rim Codes to the Rim Code field during update", async () => {
    await expect(
      submitUpdateRim(
        { role: "admin" },
        updateInput,
        createDependencies({
          updateRim: vi.fn().mockRejectedValue({
            cause: {
              code: "23505",
              constraint_name: "rim_code_lower_unique_idx",
            },
          }),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: RIM_DUPLICATE_CODE_ERROR,
      },
    })
  })

  it("returns a generic form error for unexpected update persistence failures", async () => {
    await expect(
      submitUpdateRim(
        { role: "admin" },
        updateInput,
        createDependencies({
          updateRim: vi.fn().mockRejectedValue(new Error("boom")),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: RIM_GENERIC_SAVE_ERROR,
    })
  })
})

describe("submitDeleteRim", () => {
  const deleteInput = {
    id: VALID_RIM_ID,
  }

  it("returns an inline authorization error for signed-out or non-editor delete attempts", async () => {
    await expect(submitDeleteRim(null, deleteInput)).resolves.toStrictEqual(
      authorizationErrorResult
    )

    await expect(
      submitDeleteRim({ role: "collector" }, deleteInput)
    ).resolves.toStrictEqual(authorizationErrorResult)
  })

  it("maps validation issues into typed field errors", async () => {
    const dependencies = createDependencies()

    await expect(
      submitDeleteRim({ role: "editor" }, { id: "not-a-uuid" }, dependencies)
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
    })

    expect(dependencies.deleteRim).not.toHaveBeenCalled()
  })

  it("returns a missing-row form error when the delete target no longer exists", async () => {
    await expect(
      submitDeleteRim(
        { role: "editor" },
        deleteInput,
        createDependencies({
          deleteRim: vi.fn().mockResolvedValue(null),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: RIM_MISSING_ERROR,
    })
  })

  it("maps restricted deletes to a Rim-specific form error", async () => {
    await expect(
      submitDeleteRim(
        { role: "admin" },
        deleteInput,
        createDependencies({
          deleteRim: vi.fn().mockRejectedValue({
            cause: {
              code: "23001",
              constraint_name: "coin_rim_id_rim_id_fk",
            },
          }),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: RIM_IN_USE_DELETE_ERROR,
    })
  })

  it("returns a success result for valid delete submissions", async () => {
    const dependencies = createDependencies({
      deleteRim: vi.fn().mockResolvedValue({
        id: VALID_RIM_ID,
      }),
    })

    await expect(
      submitDeleteRim({ role: "editor" }, deleteInput, dependencies)
    ).resolves.toStrictEqual({
      status: "success",
      message: "Rim deleted.",
    })

    expect(dependencies.deleteRim).toHaveBeenCalledWith(deleteInput)
  })
})
