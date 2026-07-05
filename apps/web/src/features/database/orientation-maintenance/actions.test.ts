import { describe, expect, it, vi } from "vitest"

import {
  ORIENTATION_AUTHORIZATION_ERROR,
  ORIENTATION_DUPLICATE_CODE_ERROR,
  ORIENTATION_GENERIC_SAVE_ERROR,
  ORIENTATION_IN_USE_DELETE_ERROR,
  ORIENTATION_INVALID_CODE_ERROR,
  ORIENTATION_MISSING_ERROR,
  hasOrientationMaintenanceAccess,
  submitCreateOrientation,
  submitDeleteOrientation,
  submitUpdateOrientation,
} from "./actions"

const VALID_ORIENTATION_ID = "2c717ddb-95a2-4dad-a280-f58a4779aee8"
const REEDED_ORIENTATION = {
  code: "reeded",
  name: "Reeded",
}

function createDependencies(overrides?: {
  createOrientation?: ReturnType<typeof vi.fn>
  deleteOrientation?: ReturnType<typeof vi.fn>
  updateOrientation?: ReturnType<typeof vi.fn>
}) {
  return {
    createOrientation: vi.fn(),
    deleteOrientation: vi.fn(),
    updateOrientation: vi.fn(),
    ...overrides,
  }
}

const authorizationErrorResult = {
  status: "error" as const,
  fieldErrors: {},
  formError: ORIENTATION_AUTHORIZATION_ERROR,
}

describe("hasOrientationMaintenanceAccess", () => {
  it("rejects signed-out and non-editor Collectors", () => {
    expect(hasOrientationMaintenanceAccess(null)).toBe(false)
    expect(hasOrientationMaintenanceAccess({ role: "collector" })).toBe(false)
    expect(hasOrientationMaintenanceAccess({ role: null })).toBe(false)
    expect(hasOrientationMaintenanceAccess({ role: "owner" })).toBe(false)
  })

  it("allows Editors and Admins", () => {
    expect(hasOrientationMaintenanceAccess({ role: "editor" })).toBe(true)
    expect(hasOrientationMaintenanceAccess({ role: "admin" })).toBe(true)
  })
})

describe("submitCreateOrientation", () => {
  it("returns an inline authorization error for signed-out or non-editor Collectors", async () => {
    await expect(submitCreateOrientation(null, REEDED_ORIENTATION)).resolves.toStrictEqual(
      authorizationErrorResult
    )

    await expect(
      submitCreateOrientation({ role: "collector" }, REEDED_ORIENTATION)
    ).resolves.toStrictEqual(authorizationErrorResult)
  })

  it("maps Zod validation issues into typed field errors", async () => {
    const dependencies = createDependencies()

    await expect(
      submitCreateOrientation(
        { role: "editor" },
        {
          code: "Reeded",
          name: " ",
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: ORIENTATION_INVALID_CODE_ERROR,
        name: "Orientation Name cannot be blank.",
      },
    })

    expect(dependencies.createOrientation).not.toHaveBeenCalled()
  })

  it("trims Orientation fields before creating an Orientation", async () => {
    const dependencies = createDependencies({
      createOrientation: vi.fn().mockResolvedValue({
        id: "6f18a1db-9096-433b-b3f1-906c772f7a29",
      }),
    })

    await expect(
      submitCreateOrientation(
        { role: "editor" },
        {
          code: " reeded ",
          name: " Reeded ",
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "success",
      message: "Orientation added.",
    })

    expect(dependencies.createOrientation).toHaveBeenCalledWith({
      code: "reeded",
      name: "Reeded",
    })
  })

  it("maps duplicate Orientation Codes to the Orientation Code field", async () => {
    await expect(
      submitCreateOrientation(
        { role: "admin" },
        REEDED_ORIENTATION,
        createDependencies({
          createOrientation: vi.fn().mockRejectedValue({
            cause: {
              code: "23505",
              constraint_name: "orientation_code_lower_unique_idx",
            },
          }),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: ORIENTATION_DUPLICATE_CODE_ERROR,
      },
    })
  })

  it("maps Orientation Code slug check failures to the Orientation Code field", async () => {
    await expect(
      submitCreateOrientation(
        { role: "admin" },
        REEDED_ORIENTATION,
        createDependencies({
          createOrientation: vi.fn().mockRejectedValue({
            cause: {
              code: "23514",
              constraint_name: "orientation_code_slug_check",
            },
          }),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: ORIENTATION_INVALID_CODE_ERROR,
      },
    })
  })

  it("returns a success result for valid create submissions", async () => {
    const dependencies = createDependencies({
      createOrientation: vi.fn().mockResolvedValue({
        id: "6f18a1db-9096-433b-b3f1-906c772f7a29",
      }),
    })

    await expect(
      submitCreateOrientation({ role: "editor" }, REEDED_ORIENTATION, dependencies)
    ).resolves.toStrictEqual({
      status: "success",
      message: "Orientation added.",
    })

    expect(dependencies.createOrientation).toHaveBeenCalledWith(REEDED_ORIENTATION)
  })

  it("returns a generic form error for unexpected persistence failures", async () => {
    await expect(
      submitCreateOrientation(
        { role: "admin" },
        REEDED_ORIENTATION,
        createDependencies({
          createOrientation: vi.fn().mockRejectedValue(new Error("boom")),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: ORIENTATION_GENERIC_SAVE_ERROR,
    })
  })
})

describe("submitUpdateOrientation", () => {
  const updateInput = {
    id: VALID_ORIENTATION_ID,
    ...REEDED_ORIENTATION,
  }

  it("returns an inline authorization error for signed-out or non-editor update attempts", async () => {
    await expect(submitUpdateOrientation(null, updateInput)).resolves.toStrictEqual(
      authorizationErrorResult
    )

    await expect(
      submitUpdateOrientation({ role: "collector" }, updateInput)
    ).resolves.toStrictEqual(authorizationErrorResult)
  })

  it("maps Zod update validation issues into typed field errors", async () => {
    const dependencies = createDependencies()

    await expect(
      submitUpdateOrientation(
        { role: "editor" },
        {
          id: VALID_ORIENTATION_ID,
          code: "Reeded",
          name: " ",
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: ORIENTATION_INVALID_CODE_ERROR,
        name: "Orientation Name cannot be blank.",
      },
    })

    expect(dependencies.updateOrientation).not.toHaveBeenCalled()
  })

  it("trims Orientation fields before updating an Orientation", async () => {
    const dependencies = createDependencies({
      updateOrientation: vi.fn().mockResolvedValue({
        id: VALID_ORIENTATION_ID,
      }),
    })

    await expect(
      submitUpdateOrientation(
        { role: "editor" },
        {
          id: VALID_ORIENTATION_ID,
          code: " reeded ",
          name: " Reeded ",
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "success",
      message: "Saved.",
    })

    expect(dependencies.updateOrientation).toHaveBeenCalledWith({
      id: VALID_ORIENTATION_ID,
      code: "reeded",
      name: "Reeded",
    })
  })

  it("returns a missing-row form error when the update target no longer exists", async () => {
    await expect(
      submitUpdateOrientation(
        { role: "editor" },
        updateInput,
        createDependencies({
          updateOrientation: vi.fn().mockResolvedValue(null),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: ORIENTATION_MISSING_ERROR,
    })
  })

  it("maps duplicate Orientation Codes to the Orientation Code field during update", async () => {
    await expect(
      submitUpdateOrientation(
        { role: "admin" },
        updateInput,
        createDependencies({
          updateOrientation: vi.fn().mockRejectedValue({
            cause: {
              code: "23505",
              constraint_name: "orientation_code_lower_unique_idx",
            },
          }),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: ORIENTATION_DUPLICATE_CODE_ERROR,
      },
    })
  })

  it("returns a generic form error for unexpected update persistence failures", async () => {
    await expect(
      submitUpdateOrientation(
        { role: "admin" },
        updateInput,
        createDependencies({
          updateOrientation: vi.fn().mockRejectedValue(new Error("boom")),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: ORIENTATION_GENERIC_SAVE_ERROR,
    })
  })
})

describe("submitDeleteOrientation", () => {
  const deleteInput = {
    id: VALID_ORIENTATION_ID,
  }

  it("returns an inline authorization error for signed-out or non-editor delete attempts", async () => {
    await expect(submitDeleteOrientation(null, deleteInput)).resolves.toStrictEqual(
      authorizationErrorResult
    )

    await expect(
      submitDeleteOrientation({ role: "collector" }, deleteInput)
    ).resolves.toStrictEqual(authorizationErrorResult)
  })

  it("maps validation issues into typed field errors", async () => {
    const dependencies = createDependencies()

    await expect(
      submitDeleteOrientation({ role: "editor" }, { id: "not-a-uuid" }, dependencies)
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
    })

    expect(dependencies.deleteOrientation).not.toHaveBeenCalled()
  })

  it("returns a missing-row form error when the delete target no longer exists", async () => {
    await expect(
      submitDeleteOrientation(
        { role: "editor" },
        deleteInput,
        createDependencies({
          deleteOrientation: vi.fn().mockResolvedValue(null),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: ORIENTATION_MISSING_ERROR,
    })
  })

  it("maps restricted deletes to an Orientation-specific form error", async () => {
    await expect(
      submitDeleteOrientation(
        { role: "admin" },
        deleteInput,
        createDependencies({
          deleteOrientation: vi.fn().mockRejectedValue({
            cause: {
              code: "23001",
              constraint_name: "coin_orientation_id_orientation_id_fk",
            },
          }),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: ORIENTATION_IN_USE_DELETE_ERROR,
    })
  })

  it("returns a success result for valid delete submissions", async () => {
    const dependencies = createDependencies({
      deleteOrientation: vi.fn().mockResolvedValue({
        id: VALID_ORIENTATION_ID,
      }),
    })

    await expect(
      submitDeleteOrientation({ role: "editor" }, deleteInput, dependencies)
    ).resolves.toStrictEqual({
      status: "success",
      message: "Orientation deleted.",
    })

    expect(dependencies.deleteOrientation).toHaveBeenCalledWith(deleteInput)
  })
})
