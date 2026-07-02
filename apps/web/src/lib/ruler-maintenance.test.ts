import { describe, expect, it, vi } from "vitest"

import {
  hasRulerMaintenanceAccess,
  RULER_AUTHORIZATION_ERROR,
  RULER_DUPLICATE_CODE_ERROR,
  RULER_GENERIC_SAVE_ERROR,
  RULER_IN_USE_DELETE_ERROR,
  RULER_INVALID_CODE_ERROR,
  RULER_MISSING_ERROR,
  RULER_MISSING_RULER_GROUP_ERROR,
  submitCreateRuler,
  submitDeleteRuler,
  submitUpdateRuler,
} from "./ruler-maintenance"

const VALID_RULER_ID = "2c717ddb-95a2-4dad-a280-f58a4779aee8"
const VALID_RULER_GROUP_ID = "6f18a1db-9096-433b-b3f1-906c772f7a29"
const FELIPE_V_RULER = {
  code: "felipe-v",
  name: "Felipe V",
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
    await expect(submitCreateRuler(null, FELIPE_V_RULER)).resolves.toStrictEqual(
      authorizationErrorResult
    )

    await expect(
      submitCreateRuler({ role: "collector" }, FELIPE_V_RULER)
    ).resolves.toStrictEqual(authorizationErrorResult)
  })

  it("maps Zod validation issues into typed field errors", async () => {
    const dependencies = createDependencies()

    await expect(
      submitCreateRuler(
        { role: "editor" },
        {
          code: "Felipe-V",
          name: " ",
          rulerGroupId: VALID_RULER_GROUP_ID,
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: RULER_INVALID_CODE_ERROR,
        name: "Ruler Name cannot be blank.",
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
          code: " felipe-v ",
          name: " Felipe V ",
          rulerGroupId: VALID_RULER_GROUP_ID,
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "success",
      message: "Ruler added.",
    })

    expect(dependencies.createRuler).toHaveBeenCalledWith({
      code: "felipe-v",
      name: "Felipe V",
      rulerGroupId: VALID_RULER_GROUP_ID,
    })
  })

  it("maps duplicate Ruler Codes to the Ruler Code field", async () => {
    await expect(
      submitCreateRuler(
        { role: "admin" },
        FELIPE_V_RULER,
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

  it("maps missing Ruler Group references to the Ruler Group field", async () => {
    await expect(
      submitCreateRuler(
        { role: "admin" },
        FELIPE_V_RULER,
        createDependencies({
          createRuler: vi.fn().mockRejectedValue({
            cause: {
              code: "23503",
              constraint_name: "ruler_ruler_group_id_ruler_group_id_fk",
            },
          }),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        rulerGroupId: RULER_MISSING_RULER_GROUP_ERROR,
      },
    })
  })

  it("returns a generic form error for unexpected persistence failures", async () => {
    await expect(
      submitCreateRuler(
        { role: "admin" },
        FELIPE_V_RULER,
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
    ...FELIPE_V_RULER,
  }

  it("returns an inline authorization error for signed-out or non-editor update attempts", async () => {
    await expect(submitUpdateRuler(null, updateInput)).resolves.toStrictEqual(
      authorizationErrorResult
    )

    await expect(
      submitUpdateRuler({ role: "collector" }, updateInput)
    ).resolves.toStrictEqual(authorizationErrorResult)
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
          code: " felipe-v ",
          name: " Felipe V ",
          rulerGroupId: null,
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "success",
      message: "Saved.",
    })

    expect(dependencies.updateRuler).toHaveBeenCalledWith({
      id: VALID_RULER_ID,
      code: "felipe-v",
      name: "Felipe V",
      rulerGroupId: null,
    })
  })

  it("returns a stale-row form error when the Ruler no longer exists", async () => {
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
  it("maps in-use deletes to a clear form error", async () => {
    await expect(
      submitDeleteRuler(
        { role: "editor" },
        { id: VALID_RULER_ID },
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

  it("returns a stale-row form error when deleting a missing Ruler", async () => {
    await expect(
      submitDeleteRuler(
        { role: "editor" },
        { id: VALID_RULER_ID },
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

  it("returns a success result for a valid delete submission", async () => {
    const dependencies = createDependencies({
      deleteRuler: vi.fn().mockResolvedValue({
        id: VALID_RULER_ID,
      }),
    })

    await expect(
      submitDeleteRuler(
        { role: "admin" },
        { id: VALID_RULER_ID },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "success",
      message: "Ruler deleted.",
    })
  })
})
