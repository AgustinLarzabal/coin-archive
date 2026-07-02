import { describe, expect, it, vi } from "vitest"

import {
  hasRulerMaintenanceAccess,
  RULER_AUTHORIZATION_ERROR,
  RULER_DUPLICATE_CODE_ERROR,
  RULER_GENERIC_SAVE_ERROR,
  RULER_IN_USE_DELETE_ERROR,
  RULER_INVALID_CODE_ERROR,
  RULER_MISSING_ERROR,
  submitCreateRuler,
  submitDeleteRuler,
  submitUpdateRuler,
} from "./ruler-maintenance"

const VALID_RULER_ID = "2c717ddb-95a2-4dad-a280-f58a4779aee8"
const VALID_RULER_GROUP_ID = "6955630e-75be-4d77-9e3d-6247d0650c89"
const LOUIS_RULER = {
  code: "louis-xiv",
  name: "Louis XIV",
  rulerGroupId: VALID_RULER_GROUP_ID,
}

function createDependencies(overrides?: {
  createRuler?: ReturnType<typeof vi.fn>
  deleteRuler?: ReturnType<typeof vi.fn>
  updateRuler?: ReturnType<typeof vi.fn>
}) {
  return {
    createRuler: vi.fn(),
    deleteRuler: vi.fn(),
    updateRuler: vi.fn(),
    ...overrides,
  }
}

const authorizationErrorResult = {
  status: "error" as const,
  fieldErrors: {},
  formError: RULER_AUTHORIZATION_ERROR,
}

describe("hasRulerMaintenanceAccess", () => {
  it("rejects signed-out and non-editor Collectors", () => {
    expect(hasRulerMaintenanceAccess(null)).toBe(false)
    expect(hasRulerMaintenanceAccess({ role: "collector" })).toBe(false)
    expect(hasRulerMaintenanceAccess({ role: null })).toBe(false)
    expect(hasRulerMaintenanceAccess({ role: "owner" })).toBe(false)
  })

  it("allows Editors and Admins", () => {
    expect(hasRulerMaintenanceAccess({ role: "editor" })).toBe(true)
    expect(hasRulerMaintenanceAccess({ role: "admin" })).toBe(true)
  })
})

describe("submitCreateRuler", () => {
  it("returns an inline authorization error for signed-out or non-editor Collectors", async () => {
    await expect(submitCreateRuler(null, LOUIS_RULER)).resolves.toStrictEqual(
      authorizationErrorResult
    )

    await expect(
      submitCreateRuler({ role: "collector" }, LOUIS_RULER)
    ).resolves.toStrictEqual(authorizationErrorResult)
  })

  it("maps Zod validation issues into typed field errors", async () => {
    const dependencies = createDependencies()

    await expect(
      submitCreateRuler(
        { role: "editor" },
        {
          code: "Louis-XIV",
          name: " ",
          rulerGroupId: "not-a-uuid",
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: RULER_INVALID_CODE_ERROR,
        name: "Ruler Name cannot be blank.",
        rulerGroupId: "Invalid UUID",
      },
    })

    expect(dependencies.createRuler).not.toHaveBeenCalled()
  })

  it("trims Ruler fields before creating a Ruler", async () => {
    const dependencies = createDependencies({
      createRuler: vi.fn().mockResolvedValue({
        id: VALID_RULER_ID,
      }),
    })

    await expect(
      submitCreateRuler(
        { role: "editor" },
        {
          code: " louis-xiv ",
          name: " Louis XIV ",
          rulerGroupId: ` ${VALID_RULER_GROUP_ID} `,
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "success",
      message: "Ruler added.",
    })

    expect(dependencies.createRuler).toHaveBeenCalledWith({
      code: "louis-xiv",
      name: "Louis XIV",
      rulerGroupId: VALID_RULER_GROUP_ID,
    })
  })

  it("maps duplicate Ruler Codes to the Ruler Code field", async () => {
    await expect(
      submitCreateRuler(
        { role: "admin" },
        LOUIS_RULER,
        createDependencies({
          createRuler: vi.fn().mockRejectedValue({
            cause: {
              code: "23505",
              constraint_name: "ruler_code_unique_idx",
            },
          }),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: RULER_DUPLICATE_CODE_ERROR,
      },
    })
  })

  it("maps Ruler Code slug check failures to the Ruler Code field", async () => {
    await expect(
      submitCreateRuler(
        { role: "admin" },
        LOUIS_RULER,
        createDependencies({
          createRuler: vi.fn().mockRejectedValue({
            cause: {
              code: "23514",
              constraint_name: "ruler_code_slug_check",
            },
          }),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: RULER_INVALID_CODE_ERROR,
      },
    })
  })

  it("returns a success result for valid create submissions", async () => {
    const dependencies = createDependencies({
      createRuler: vi.fn().mockResolvedValue({
        id: VALID_RULER_ID,
      }),
    })

    await expect(
      submitCreateRuler({ role: "editor" }, LOUIS_RULER, dependencies)
    ).resolves.toStrictEqual({
      status: "success",
      message: "Ruler added.",
    })

    expect(dependencies.createRuler).toHaveBeenCalledWith(LOUIS_RULER)
  })

  it("returns a generic form error for unexpected persistence failures", async () => {
    await expect(
      submitCreateRuler(
        { role: "admin" },
        LOUIS_RULER,
        createDependencies({
          createRuler: vi.fn().mockRejectedValue(new Error("boom")),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: RULER_GENERIC_SAVE_ERROR,
    })
  })
})

describe("submitUpdateRuler", () => {
  const updateInput = {
    id: VALID_RULER_ID,
    ...LOUIS_RULER,
  }

  it("returns an inline authorization error for signed-out or non-editor update attempts", async () => {
    await expect(
      submitUpdateRuler(null, updateInput)
    ).resolves.toStrictEqual(authorizationErrorResult)

    await expect(
      submitUpdateRuler({ role: "collector" }, updateInput)
    ).resolves.toStrictEqual(authorizationErrorResult)
  })

  it("maps Zod update validation issues into typed field errors", async () => {
    const dependencies = createDependencies()

    await expect(
      submitUpdateRuler(
        { role: "editor" },
        {
          id: VALID_RULER_ID,
          code: "Louis-XIV",
          name: " ",
          rulerGroupId: "not-a-uuid",
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: RULER_INVALID_CODE_ERROR,
        name: "Ruler Name cannot be blank.",
        rulerGroupId: "Invalid UUID",
      },
    })

    expect(dependencies.updateRuler).not.toHaveBeenCalled()
  })

  it("trims Ruler fields before updating a Ruler", async () => {
    const dependencies = createDependencies({
      updateRuler: vi.fn().mockResolvedValue({
        id: VALID_RULER_ID,
      }),
    })

    await expect(
      submitUpdateRuler(
        { role: "editor" },
        {
          id: VALID_RULER_ID,
          code: " louis-xiv ",
          name: " Louis XIV ",
          rulerGroupId: ` ${VALID_RULER_GROUP_ID} `,
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "success",
      message: "Saved.",
    })

    expect(dependencies.updateRuler).toHaveBeenCalledWith({
      id: VALID_RULER_ID,
      code: "louis-xiv",
      name: "Louis XIV",
      rulerGroupId: VALID_RULER_GROUP_ID,
    })
  })

  it("returns the stale-row error when the Ruler no longer exists", async () => {
    await expect(
      submitUpdateRuler(
        { role: "admin" },
        updateInput,
        createDependencies({
          updateRuler: vi.fn().mockResolvedValue(null),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: RULER_MISSING_ERROR,
    })
  })
})

describe("submitDeleteRuler", () => {
  const deleteInput = {
    id: VALID_RULER_ID,
  }

  it("returns an inline authorization error for signed-out or non-editor delete attempts", async () => {
    await expect(
      submitDeleteRuler(null, deleteInput)
    ).resolves.toStrictEqual(authorizationErrorResult)

    await expect(
      submitDeleteRuler({ role: "collector" }, deleteInput)
    ).resolves.toStrictEqual(authorizationErrorResult)
  })

  it("maps in-use delete failures to the shared delete guidance", async () => {
    await expect(
      submitDeleteRuler(
        { role: "editor" },
        deleteInput,
        createDependencies({
          deleteRuler: vi.fn().mockRejectedValue({
            cause: {
              code: "23001",
              constraint_name: "coin_ruler_ruler_id_ruler_id_fk",
            },
          }),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: RULER_IN_USE_DELETE_ERROR,
    })
  })

  it("returns the stale-row error when deleting a missing Ruler", async () => {
    await expect(
      submitDeleteRuler(
        { role: "admin" },
        deleteInput,
        createDependencies({
          deleteRuler: vi.fn().mockResolvedValue(null),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: RULER_MISSING_ERROR,
    })
  })

  it("returns a success result for valid delete submissions", async () => {
    const dependencies = createDependencies({
      deleteRuler: vi.fn().mockResolvedValue({
        id: VALID_RULER_ID,
      }),
    })

    await expect(
      submitDeleteRuler({ role: "admin" }, deleteInput, dependencies)
    ).resolves.toStrictEqual({
      status: "success",
      message: "Ruler deleted.",
    })

    expect(dependencies.deleteRuler).toHaveBeenCalledWith(deleteInput)
  })
})
