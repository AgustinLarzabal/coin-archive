import { describe, expect, it, vi } from "vitest"

import {
  hasRulerGroupMaintenanceAccess,
  RULER_GROUP_AUTHORIZATION_ERROR,
  RULER_GROUP_DUPLICATE_CODE_ERROR,
  RULER_GROUP_GENERIC_SAVE_ERROR,
  RULER_GROUP_IN_USE_DELETE_ERROR,
  RULER_GROUP_INVALID_CODE_ERROR,
  RULER_GROUP_MISSING_ERROR,
  submitCreateRulerGroup,
  submitDeleteRulerGroup,
  submitUpdateRulerGroup,
} from "./ruler-group-maintenance"

const VALID_RULER_GROUP_ID = "2c717ddb-95a2-4dad-a280-f58a4779aee8"
const BOURBON_RULER_GROUP = {
  code: "house-of-bourbon",
  name: "House of Bourbon",
}

function createDependencies(overrides?: {
  createRulerGroup?: ReturnType<typeof vi.fn>
  deleteRulerGroup?: ReturnType<typeof vi.fn>
  updateRulerGroup?: ReturnType<typeof vi.fn>
}) {
  return {
    createRulerGroup: vi.fn(),
    deleteRulerGroup: vi.fn(),
    updateRulerGroup: vi.fn(),
    ...overrides,
  }
}

const authorizationErrorResult = {
  status: "error" as const,
  fieldErrors: {},
  formError: RULER_GROUP_AUTHORIZATION_ERROR,
}

describe("hasRulerGroupMaintenanceAccess", () => {
  it("rejects signed-out and non-editor Collectors", () => {
    expect(hasRulerGroupMaintenanceAccess(null)).toBe(false)
    expect(hasRulerGroupMaintenanceAccess({ role: "collector" })).toBe(false)
    expect(hasRulerGroupMaintenanceAccess({ role: null })).toBe(false)
    expect(hasRulerGroupMaintenanceAccess({ role: "owner" })).toBe(false)
  })

  it("allows Editors and Admins", () => {
    expect(hasRulerGroupMaintenanceAccess({ role: "editor" })).toBe(true)
    expect(hasRulerGroupMaintenanceAccess({ role: "admin" })).toBe(true)
  })
})

describe("submitCreateRulerGroup", () => {
  it("returns an inline authorization error for signed-out or non-editor Collectors", async () => {
    await expect(
      submitCreateRulerGroup(null, BOURBON_RULER_GROUP)
    ).resolves.toStrictEqual(authorizationErrorResult)

    await expect(
      submitCreateRulerGroup({ role: "collector" }, BOURBON_RULER_GROUP)
    ).resolves.toStrictEqual(authorizationErrorResult)
  })

  it("maps Zod validation issues into typed field errors", async () => {
    const dependencies = createDependencies()

    await expect(
      submitCreateRulerGroup(
        { role: "editor" },
        {
          code: "House-Of-Bourbon",
          name: " ",
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: RULER_GROUP_INVALID_CODE_ERROR,
        name: "Ruler Group Name cannot be blank.",
      },
    })

    expect(dependencies.createRulerGroup).not.toHaveBeenCalled()
  })

  it("trims Ruler Group fields before creating a Ruler Group", async () => {
    const dependencies = createDependencies({
      createRulerGroup: vi.fn().mockResolvedValue({
        id: "6f18a1db-9096-433b-b3f1-906c772f7a29",
      }),
    })

    await expect(
      submitCreateRulerGroup(
        { role: "editor" },
        {
          code: " house-of-bourbon ",
          name: " House of Bourbon ",
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "success",
      message: "Ruler Group added.",
    })

    expect(dependencies.createRulerGroup).toHaveBeenCalledWith({
      code: "house-of-bourbon",
      name: "House of Bourbon",
    })
  })

  it("maps duplicate Ruler Group Codes to the Ruler Group Code field", async () => {
    await expect(
      submitCreateRulerGroup(
        { role: "admin" },
        BOURBON_RULER_GROUP,
        createDependencies({
          createRulerGroup: vi.fn().mockRejectedValue({
            cause: {
              code: "23505",
              constraint_name: "ruler_group_code_unique_idx",
            },
          }),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: RULER_GROUP_DUPLICATE_CODE_ERROR,
      },
    })
  })

  it("maps Ruler Group Code slug check failures to the Ruler Group Code field", async () => {
    await expect(
      submitCreateRulerGroup(
        { role: "admin" },
        BOURBON_RULER_GROUP,
        createDependencies({
          createRulerGroup: vi.fn().mockRejectedValue({
            cause: {
              code: "23514",
              constraint_name: "ruler_group_code_slug_check",
            },
          }),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: RULER_GROUP_INVALID_CODE_ERROR,
      },
    })
  })

  it("returns a success result for valid create submissions", async () => {
    const dependencies = createDependencies({
      createRulerGroup: vi.fn().mockResolvedValue({
        id: "6f18a1db-9096-433b-b3f1-906c772f7a29",
      }),
    })

    await expect(
      submitCreateRulerGroup(
        { role: "editor" },
        BOURBON_RULER_GROUP,
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "success",
      message: "Ruler Group added.",
    })

    expect(dependencies.createRulerGroup).toHaveBeenCalledWith(
      BOURBON_RULER_GROUP
    )
  })

  it("returns a generic form error for unexpected persistence failures", async () => {
    await expect(
      submitCreateRulerGroup(
        { role: "admin" },
        BOURBON_RULER_GROUP,
        createDependencies({
          createRulerGroup: vi.fn().mockRejectedValue(new Error("boom")),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: RULER_GROUP_GENERIC_SAVE_ERROR,
    })
  })
})

describe("submitUpdateRulerGroup", () => {
  const updateInput = {
    id: VALID_RULER_GROUP_ID,
    ...BOURBON_RULER_GROUP,
  }

  it("returns an inline authorization error for signed-out or non-editor update attempts", async () => {
    await expect(
      submitUpdateRulerGroup(null, updateInput)
    ).resolves.toStrictEqual(authorizationErrorResult)

    await expect(
      submitUpdateRulerGroup({ role: "collector" }, updateInput)
    ).resolves.toStrictEqual(authorizationErrorResult)
  })

  it("maps Zod update validation issues into typed field errors", async () => {
    const dependencies = createDependencies()

    await expect(
      submitUpdateRulerGroup(
        { role: "editor" },
        {
          id: VALID_RULER_GROUP_ID,
          code: "House-Of-Bourbon",
          name: " ",
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: RULER_GROUP_INVALID_CODE_ERROR,
        name: "Ruler Group Name cannot be blank.",
      },
    })

    expect(dependencies.updateRulerGroup).not.toHaveBeenCalled()
  })

  it("trims Ruler Group fields before updating a Ruler Group", async () => {
    const dependencies = createDependencies({
      updateRulerGroup: vi.fn().mockResolvedValue({
        id: VALID_RULER_GROUP_ID,
      }),
    })

    await expect(
      submitUpdateRulerGroup(
        { role: "editor" },
        {
          id: VALID_RULER_GROUP_ID,
          code: " house-of-bourbon ",
          name: " House of Bourbon ",
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "success",
      message: "Saved.",
    })

    expect(dependencies.updateRulerGroup).toHaveBeenCalledWith({
      id: VALID_RULER_GROUP_ID,
      code: "house-of-bourbon",
      name: "House of Bourbon",
    })
  })

  it("maps stale-row update failures to a form error", async () => {
    await expect(
      submitUpdateRulerGroup(
        { role: "admin" },
        updateInput,
        createDependencies({
          updateRulerGroup: vi.fn().mockResolvedValue(null),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: RULER_GROUP_MISSING_ERROR,
    })
  })
})

describe("submitDeleteRulerGroup", () => {
  const deleteInput = {
    id: VALID_RULER_GROUP_ID,
  }

  it("returns an inline authorization error for signed-out or non-editor delete attempts", async () => {
    await expect(
      submitDeleteRulerGroup(null, deleteInput)
    ).resolves.toStrictEqual(authorizationErrorResult)

    await expect(
      submitDeleteRulerGroup({ role: "collector" }, deleteInput)
    ).resolves.toStrictEqual(authorizationErrorResult)
  })

  it("maps stale-row delete failures to a form error", async () => {
    await expect(
      submitDeleteRulerGroup(
        { role: "editor" },
        deleteInput,
        createDependencies({
          deleteRulerGroup: vi.fn().mockResolvedValue(null),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: RULER_GROUP_MISSING_ERROR,
    })
  })

  it("maps in-use delete failures to the shared form error", async () => {
    await expect(
      submitDeleteRulerGroup(
        { role: "admin" },
        deleteInput,
        createDependencies({
          deleteRulerGroup: vi.fn().mockRejectedValue({
            cause: {
              code: "23001",
              constraint_name: "ruler_ruler_group_id_ruler_group_id_fk",
            },
          }),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: RULER_GROUP_IN_USE_DELETE_ERROR,
    })
  })

  it("returns a success result for valid delete submissions", async () => {
    const dependencies = createDependencies({
      deleteRulerGroup: vi.fn().mockResolvedValue({
        id: VALID_RULER_GROUP_ID,
      }),
    })

    await expect(
      submitDeleteRulerGroup({ role: "editor" }, deleteInput, dependencies)
    ).resolves.toStrictEqual({
      status: "success",
      message: "Ruler Group deleted.",
    })

    expect(dependencies.deleteRulerGroup).toHaveBeenCalledWith(deleteInput)
  })

  it("returns a generic form error for unexpected delete failures", async () => {
    await expect(
      submitDeleteRulerGroup(
        { role: "admin" },
        deleteInput,
        createDependencies({
          deleteRulerGroup: vi.fn().mockRejectedValue(new Error("boom")),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: RULER_GROUP_GENERIC_SAVE_ERROR,
    })
  })
})
