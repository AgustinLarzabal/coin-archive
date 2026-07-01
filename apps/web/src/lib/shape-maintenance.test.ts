import { describe, expect, it, vi } from "vitest"

import {
  SHAPE_AUTHORIZATION_ERROR,
  SHAPE_DUPLICATE_CODE_ERROR,
  SHAPE_GENERIC_SAVE_ERROR,
  SHAPE_IN_USE_DELETE_ERROR,
  SHAPE_INVALID_CODE_ERROR,
  SHAPE_MISSING_ERROR,
  hasShapeMaintenanceAccess,
  submitCreateShape,
  submitDeleteShape,
  submitUpdateShape,
} from "./shape-maintenance"

const VALID_SHAPE_ID = "2c717ddb-95a2-4dad-a280-f58a4779aee8"
const ROUND_SHAPE = {
  code: "round",
  name: "Round",
}

function createDependencies(overrides?: {
  createShape?: ReturnType<typeof vi.fn>
  deleteShape?: ReturnType<typeof vi.fn>
  updateShape?: ReturnType<typeof vi.fn>
}) {
  return {
    createShape: vi.fn(),
    deleteShape: vi.fn(),
    updateShape: vi.fn(),
    ...overrides,
  }
}

const authorizationErrorResult = {
  status: "error" as const,
  fieldErrors: {},
  formError: SHAPE_AUTHORIZATION_ERROR,
}

describe("hasShapeMaintenanceAccess", () => {
  it("rejects signed-out and non-editor Collectors", () => {
    expect(hasShapeMaintenanceAccess(null)).toBe(false)
    expect(hasShapeMaintenanceAccess({ role: "collector" })).toBe(false)
    expect(hasShapeMaintenanceAccess({ role: null })).toBe(false)
    expect(hasShapeMaintenanceAccess({ role: "owner" })).toBe(false)
  })

  it("allows Editors and Admins", () => {
    expect(hasShapeMaintenanceAccess({ role: "editor" })).toBe(true)
    expect(hasShapeMaintenanceAccess({ role: "admin" })).toBe(true)
  })
})

describe("submitCreateShape", () => {
  it("returns an inline authorization error for signed-out or non-editor Collectors", async () => {
    await expect(submitCreateShape(null, ROUND_SHAPE)).resolves.toStrictEqual(
      authorizationErrorResult
    )

    await expect(
      submitCreateShape({ role: "collector" }, ROUND_SHAPE)
    ).resolves.toStrictEqual(authorizationErrorResult)
  })

  it("maps Zod validation issues into typed field errors", async () => {
    const dependencies = createDependencies()

    await expect(
      submitCreateShape(
        { role: "editor" },
        {
          code: "Round",
          name: " ",
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: SHAPE_INVALID_CODE_ERROR,
        name: "Shape Name cannot be blank.",
      },
    })

    expect(dependencies.createShape).not.toHaveBeenCalled()
  })

  it("trims Shape fields before creating a Shape", async () => {
    const dependencies = createDependencies({
      createShape: vi.fn().mockResolvedValue({
        id: "6f18a1db-9096-433b-b3f1-906c772f7a29",
      }),
    })

    await expect(
      submitCreateShape(
        { role: "editor" },
        {
          code: " round ",
          name: " Round ",
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "success",
      message: "Shape added.",
    })

    expect(dependencies.createShape).toHaveBeenCalledWith({
      code: "round",
      name: "Round",
    })
  })

  it("maps duplicate Shape Codes to the Shape Code field", async () => {
    await expect(
      submitCreateShape(
        { role: "admin" },
        ROUND_SHAPE,
        createDependencies({
          createShape: vi.fn().mockRejectedValue({
            cause: {
              code: "23505",
              constraint_name: "shape_code_lower_unique_idx",
            },
          }),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: SHAPE_DUPLICATE_CODE_ERROR,
      },
    })
  })

  it("maps Shape Code slug check failures to the Shape Code field", async () => {
    await expect(
      submitCreateShape(
        { role: "admin" },
        ROUND_SHAPE,
        createDependencies({
          createShape: vi.fn().mockRejectedValue({
            cause: {
              code: "23514",
              constraint_name: "shape_code_slug_check",
            },
          }),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: SHAPE_INVALID_CODE_ERROR,
      },
    })
  })

  it("returns a success result for valid create submissions", async () => {
    const dependencies = createDependencies({
      createShape: vi.fn().mockResolvedValue({
        id: "6f18a1db-9096-433b-b3f1-906c772f7a29",
      }),
    })

    await expect(
      submitCreateShape({ role: "editor" }, ROUND_SHAPE, dependencies)
    ).resolves.toStrictEqual({
      status: "success",
      message: "Shape added.",
    })

    expect(dependencies.createShape).toHaveBeenCalledWith(ROUND_SHAPE)
  })

  it("returns a generic form error for unexpected persistence failures", async () => {
    await expect(
      submitCreateShape(
        { role: "admin" },
        ROUND_SHAPE,
        createDependencies({
          createShape: vi.fn().mockRejectedValue(new Error("boom")),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: SHAPE_GENERIC_SAVE_ERROR,
    })
  })
})

describe("submitUpdateShape", () => {
  const updateInput = {
    id: VALID_SHAPE_ID,
    ...ROUND_SHAPE,
  }

  it("returns an inline authorization error for signed-out or non-editor update attempts", async () => {
    await expect(submitUpdateShape(null, updateInput)).resolves.toStrictEqual(
      authorizationErrorResult
    )

    await expect(
      submitUpdateShape({ role: "collector" }, updateInput)
    ).resolves.toStrictEqual(authorizationErrorResult)
  })

  it("maps Zod update validation issues into typed field errors", async () => {
    const dependencies = createDependencies()

    await expect(
      submitUpdateShape(
        { role: "editor" },
        {
          id: VALID_SHAPE_ID,
          code: "Round",
          name: " ",
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: SHAPE_INVALID_CODE_ERROR,
        name: "Shape Name cannot be blank.",
      },
    })

    expect(dependencies.updateShape).not.toHaveBeenCalled()
  })

  it("trims Shape fields before updating a Shape", async () => {
    const dependencies = createDependencies({
      updateShape: vi.fn().mockResolvedValue({
        id: VALID_SHAPE_ID,
      }),
    })

    await expect(
      submitUpdateShape(
        { role: "editor" },
        {
          id: VALID_SHAPE_ID,
          code: " round ",
          name: " Round ",
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "success",
      message: "Saved.",
    })

    expect(dependencies.updateShape).toHaveBeenCalledWith({
      id: VALID_SHAPE_ID,
      code: "round",
      name: "Round",
    })
  })

  it("returns a missing-row form error when the update target no longer exists", async () => {
    await expect(
      submitUpdateShape(
        { role: "editor" },
        updateInput,
        createDependencies({
          updateShape: vi.fn().mockResolvedValue(null),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: SHAPE_MISSING_ERROR,
    })
  })

  it("maps duplicate Shape Codes to the Shape Code field during update", async () => {
    await expect(
      submitUpdateShape(
        { role: "admin" },
        updateInput,
        createDependencies({
          updateShape: vi.fn().mockRejectedValue({
            cause: {
              code: "23505",
              constraint_name: "shape_code_lower_unique_idx",
            },
          }),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: SHAPE_DUPLICATE_CODE_ERROR,
      },
    })
  })

  it("returns a generic form error for unexpected update persistence failures", async () => {
    await expect(
      submitUpdateShape(
        { role: "admin" },
        updateInput,
        createDependencies({
          updateShape: vi.fn().mockRejectedValue(new Error("boom")),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: SHAPE_GENERIC_SAVE_ERROR,
    })
  })
})

describe("submitDeleteShape", () => {
  const deleteInput = {
    id: VALID_SHAPE_ID,
  }

  it("returns an inline authorization error for signed-out or non-editor delete attempts", async () => {
    await expect(submitDeleteShape(null, deleteInput)).resolves.toStrictEqual(
      authorizationErrorResult
    )

    await expect(
      submitDeleteShape({ role: "collector" }, deleteInput)
    ).resolves.toStrictEqual(authorizationErrorResult)
  })

  it("maps validation issues into typed field errors", async () => {
    const dependencies = createDependencies()

    await expect(
      submitDeleteShape({ role: "editor" }, { id: "not-a-uuid" }, dependencies)
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
    })

    expect(dependencies.deleteShape).not.toHaveBeenCalled()
  })

  it("returns a missing-row form error when the delete target no longer exists", async () => {
    await expect(
      submitDeleteShape(
        { role: "editor" },
        deleteInput,
        createDependencies({
          deleteShape: vi.fn().mockResolvedValue(null),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: SHAPE_MISSING_ERROR,
    })
  })

  it("maps in-use delete failures to a Shape form error", async () => {
    await expect(
      submitDeleteShape(
        { role: "admin" },
        deleteInput,
        createDependencies({
          deleteShape: vi.fn().mockRejectedValue({
            cause: {
              code: "23001",
              constraint_name: "coin_shape_id_shape_id_fk",
            },
          }),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: SHAPE_IN_USE_DELETE_ERROR,
    })
  })

  it("returns a success result for valid delete submissions", async () => {
    const dependencies = createDependencies({
      deleteShape: vi.fn().mockResolvedValue({
        id: VALID_SHAPE_ID,
      }),
    })

    await expect(
      submitDeleteShape({ role: "editor" }, deleteInput, dependencies)
    ).resolves.toStrictEqual({
      status: "success",
      message: "Shape deleted.",
    })

    expect(dependencies.deleteShape).toHaveBeenCalledWith(deleteInput)
  })

  it("returns a generic form error for unexpected delete persistence failures", async () => {
    await expect(
      submitDeleteShape(
        { role: "admin" },
        deleteInput,
        createDependencies({
          deleteShape: vi.fn().mockRejectedValue(new Error("boom")),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: SHAPE_GENERIC_SAVE_ERROR,
    })
  })
})
