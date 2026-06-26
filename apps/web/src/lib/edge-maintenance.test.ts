import { describe, expect, it, vi } from "vitest"

import {
  EDGE_AUTHORIZATION_ERROR,
  EDGE_DUPLICATE_CODE_ERROR,
  EDGE_GENERIC_SAVE_ERROR,
  EDGE_IN_USE_DELETE_ERROR,
  EDGE_INVALID_CODE_ERROR,
  EDGE_MISSING_ERROR,
  hasEdgeMaintenanceAccess,
  submitCreateEdge,
  submitDeleteEdge,
  submitUpdateEdge,
} from "./edge-maintenance"

const VALID_EDGE_ID = "2c717ddb-95a2-4dad-a280-f58a4779aee8"
const REEDED_EDGE = {
  code: "reeded",
  name: "Reeded",
}

function createDependencies(overrides?: {
  createEdge?: ReturnType<typeof vi.fn>
  deleteEdge?: ReturnType<typeof vi.fn>
  updateEdge?: ReturnType<typeof vi.fn>
}) {
  return {
    createEdge: vi.fn(),
    deleteEdge: vi.fn(),
    updateEdge: vi.fn(),
    ...overrides,
  }
}

const authorizationErrorResult = {
  status: "error" as const,
  fieldErrors: {},
  formError: EDGE_AUTHORIZATION_ERROR,
}

describe("hasEdgeMaintenanceAccess", () => {
  it("rejects signed-out and non-editor Collectors", () => {
    expect(hasEdgeMaintenanceAccess(null)).toBe(false)
    expect(hasEdgeMaintenanceAccess({ role: "collector" })).toBe(false)
    expect(hasEdgeMaintenanceAccess({ role: null })).toBe(false)
    expect(hasEdgeMaintenanceAccess({ role: "owner" })).toBe(false)
  })

  it("allows Editors and Admins", () => {
    expect(hasEdgeMaintenanceAccess({ role: "editor" })).toBe(true)
    expect(hasEdgeMaintenanceAccess({ role: "admin" })).toBe(true)
  })
})

describe("submitCreateEdge", () => {
  it("returns an inline authorization error for signed-out or non-editor Collectors", async () => {
    await expect(submitCreateEdge(null, REEDED_EDGE)).resolves.toStrictEqual(
      authorizationErrorResult
    )

    await expect(
      submitCreateEdge({ role: "collector" }, REEDED_EDGE)
    ).resolves.toStrictEqual(authorizationErrorResult)
  })

  it("maps Zod validation issues into typed field errors", async () => {
    const dependencies = createDependencies()

    await expect(
      submitCreateEdge(
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
        code: EDGE_INVALID_CODE_ERROR,
        name: "Edge Name cannot be blank.",
      },
    })

    expect(dependencies.createEdge).not.toHaveBeenCalled()
  })

  it("trims Edge fields before creating an Edge", async () => {
    const dependencies = createDependencies({
      createEdge: vi.fn().mockResolvedValue({
        id: "6f18a1db-9096-433b-b3f1-906c772f7a29",
      }),
    })

    await expect(
      submitCreateEdge(
        { role: "editor" },
        {
          code: " reeded ",
          name: " Reeded ",
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "success",
      message: "Edge added.",
    })

    expect(dependencies.createEdge).toHaveBeenCalledWith({
      code: "reeded",
      name: "Reeded",
    })
  })

  it("maps duplicate Edge Codes to the Edge Code field", async () => {
    await expect(
      submitCreateEdge(
        { role: "admin" },
        REEDED_EDGE,
        createDependencies({
          createEdge: vi.fn().mockRejectedValue({
            cause: {
              code: "23505",
              constraint_name: "edge_code_lower_unique_idx",
            },
          }),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: EDGE_DUPLICATE_CODE_ERROR,
      },
    })
  })

  it("maps Edge Code slug check failures to the Edge Code field", async () => {
    await expect(
      submitCreateEdge(
        { role: "admin" },
        REEDED_EDGE,
        createDependencies({
          createEdge: vi.fn().mockRejectedValue({
            cause: {
              code: "23514",
              constraint_name: "edge_code_slug_check",
            },
          }),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: EDGE_INVALID_CODE_ERROR,
      },
    })
  })

  it("returns a success result for valid create submissions", async () => {
    const dependencies = createDependencies({
      createEdge: vi.fn().mockResolvedValue({
        id: "6f18a1db-9096-433b-b3f1-906c772f7a29",
      }),
    })

    await expect(
      submitCreateEdge({ role: "editor" }, REEDED_EDGE, dependencies)
    ).resolves.toStrictEqual({
      status: "success",
      message: "Edge added.",
    })

    expect(dependencies.createEdge).toHaveBeenCalledWith(REEDED_EDGE)
  })

  it("returns a generic form error for unexpected persistence failures", async () => {
    await expect(
      submitCreateEdge(
        { role: "admin" },
        REEDED_EDGE,
        createDependencies({
          createEdge: vi.fn().mockRejectedValue(new Error("boom")),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: EDGE_GENERIC_SAVE_ERROR,
    })
  })
})

describe("submitUpdateEdge", () => {
  const updateInput = {
    id: VALID_EDGE_ID,
    ...REEDED_EDGE,
  }

  it("returns an inline authorization error for signed-out or non-editor update attempts", async () => {
    await expect(submitUpdateEdge(null, updateInput)).resolves.toStrictEqual(
      authorizationErrorResult
    )

    await expect(
      submitUpdateEdge({ role: "collector" }, updateInput)
    ).resolves.toStrictEqual(authorizationErrorResult)
  })

  it("maps Zod update validation issues into typed field errors", async () => {
    const dependencies = createDependencies()

    await expect(
      submitUpdateEdge(
        { role: "editor" },
        {
          id: VALID_EDGE_ID,
          code: "Reeded",
          name: " ",
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: EDGE_INVALID_CODE_ERROR,
        name: "Edge Name cannot be blank.",
      },
    })

    expect(dependencies.updateEdge).not.toHaveBeenCalled()
  })

  it("trims Edge fields before updating an Edge", async () => {
    const dependencies = createDependencies({
      updateEdge: vi.fn().mockResolvedValue({
        id: VALID_EDGE_ID,
      }),
    })

    await expect(
      submitUpdateEdge(
        { role: "editor" },
        {
          id: VALID_EDGE_ID,
          code: " reeded ",
          name: " Reeded ",
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "success",
      message: "Saved.",
    })

    expect(dependencies.updateEdge).toHaveBeenCalledWith({
      id: VALID_EDGE_ID,
      code: "reeded",
      name: "Reeded",
    })
  })

  it("returns a missing-row form error when the update target no longer exists", async () => {
    await expect(
      submitUpdateEdge(
        { role: "editor" },
        updateInput,
        createDependencies({
          updateEdge: vi.fn().mockResolvedValue(null),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: EDGE_MISSING_ERROR,
    })
  })

  it("maps duplicate Edge Codes to the Edge Code field during update", async () => {
    await expect(
      submitUpdateEdge(
        { role: "admin" },
        updateInput,
        createDependencies({
          updateEdge: vi.fn().mockRejectedValue({
            cause: {
              code: "23505",
              constraint_name: "edge_code_lower_unique_idx",
            },
          }),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: EDGE_DUPLICATE_CODE_ERROR,
      },
    })
  })

  it("returns a generic form error for unexpected update persistence failures", async () => {
    await expect(
      submitUpdateEdge(
        { role: "admin" },
        updateInput,
        createDependencies({
          updateEdge: vi.fn().mockRejectedValue(new Error("boom")),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: EDGE_GENERIC_SAVE_ERROR,
    })
  })
})

describe("submitDeleteEdge", () => {
  const deleteInput = {
    id: VALID_EDGE_ID,
  }

  it("returns an inline authorization error for signed-out or non-editor delete attempts", async () => {
    await expect(submitDeleteEdge(null, deleteInput)).resolves.toStrictEqual(
      authorizationErrorResult
    )

    await expect(
      submitDeleteEdge({ role: "collector" }, deleteInput)
    ).resolves.toStrictEqual(authorizationErrorResult)
  })

  it("maps validation issues into typed field errors", async () => {
    const dependencies = createDependencies()

    await expect(
      submitDeleteEdge({ role: "editor" }, { id: "not-a-uuid" }, dependencies)
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
    })

    expect(dependencies.deleteEdge).not.toHaveBeenCalled()
  })

  it("returns a missing-row form error when the delete target no longer exists", async () => {
    await expect(
      submitDeleteEdge(
        { role: "editor" },
        deleteInput,
        createDependencies({
          deleteEdge: vi.fn().mockResolvedValue(null),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: EDGE_MISSING_ERROR,
    })
  })

  it("maps restricted deletes to an Edge-specific form error", async () => {
    await expect(
      submitDeleteEdge(
        { role: "admin" },
        deleteInput,
        createDependencies({
          deleteEdge: vi.fn().mockRejectedValue({
            cause: {
              code: "23001",
              constraint_name: "coin_edge_id_edge_id_fk",
            },
          }),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: EDGE_IN_USE_DELETE_ERROR,
    })
  })

  it("returns a success result for valid delete submissions", async () => {
    const dependencies = createDependencies({
      deleteEdge: vi.fn().mockResolvedValue({
        id: VALID_EDGE_ID,
      }),
    })

    await expect(
      submitDeleteEdge({ role: "editor" }, deleteInput, dependencies)
    ).resolves.toStrictEqual({
      status: "success",
      message: "Edge deleted.",
    })

    expect(dependencies.deleteEdge).toHaveBeenCalledWith(deleteInput)
  })
})
