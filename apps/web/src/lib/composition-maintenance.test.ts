import { describe, expect, it, vi } from "vitest"

import {
  COMPOSITION_AUTHORIZATION_ERROR,
  COMPOSITION_DUPLICATE_CODE_ERROR,
  COMPOSITION_GENERIC_SAVE_ERROR,
  COMPOSITION_IN_USE_DELETE_ERROR,
  COMPOSITION_INVALID_CODE_ERROR,
  COMPOSITION_MISSING_ERROR,
  hasCompositionMaintenanceAccess,
  submitCreateComposition,
  submitDeleteComposition,
  submitUpdateComposition,
} from "./composition-maintenance"

const VALID_COMPOSITION_ID = "2c717ddb-95a2-4dad-a280-f58a4779aee8"
const SILVER_COMPOSITION = {
  code: "silver-900",
  name: "Silver (.900)",
  description: "Ninety percent silver alloy.",
}

function createDependencies(overrides?: {
  createComposition?: ReturnType<typeof vi.fn>
}) {
  return {
    createComposition: vi.fn(),
    deleteComposition: vi.fn(),
    updateComposition: vi.fn(),
    ...overrides,
  }
}

function updateDependencies(overrides?: {
  updateComposition?: ReturnType<typeof vi.fn>
}) {
  return {
    createComposition: vi.fn(),
    deleteComposition: vi.fn(),
    updateComposition: vi.fn(),
    ...overrides,
  }
}

function deleteDependencies(overrides?: {
  deleteComposition?: ReturnType<typeof vi.fn>
}) {
  return {
    createComposition: vi.fn(),
    deleteComposition: vi.fn(),
    updateComposition: vi.fn(),
    ...overrides,
  }
}

const authorizationErrorResult = {
  status: "error" as const,
  fieldErrors: {},
  formError: COMPOSITION_AUTHORIZATION_ERROR,
}

describe("hasCompositionMaintenanceAccess", () => {
  it("rejects signed-out and non-editor Collectors", () => {
    expect(hasCompositionMaintenanceAccess(null)).toBe(false)
    expect(hasCompositionMaintenanceAccess({ role: "collector" })).toBe(false)
    expect(hasCompositionMaintenanceAccess({ role: null })).toBe(false)
    expect(hasCompositionMaintenanceAccess({ role: "owner" })).toBe(false)
  })

  it("allows Editors and Admins", () => {
    expect(hasCompositionMaintenanceAccess({ role: "editor" })).toBe(true)
    expect(hasCompositionMaintenanceAccess({ role: "admin" })).toBe(true)
  })
})

describe("submitCreateComposition", () => {
  it("returns an inline authorization error for signed-out or non-editor Collectors", async () => {
    await expect(
      submitCreateComposition(null, SILVER_COMPOSITION)
    ).resolves.toStrictEqual(authorizationErrorResult)

    await expect(
      submitCreateComposition({ role: "collector" }, SILVER_COMPOSITION)
    ).resolves.toStrictEqual(authorizationErrorResult)
  })

  it("maps Zod validation issues into typed field errors", async () => {
    const dependencies = createDependencies()

    await expect(
      submitCreateComposition(
        { role: "editor" },
        {
          code: "Silver 900",
          name: " ",
          description: "  test  ",
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: COMPOSITION_INVALID_CODE_ERROR,
        name: "Composition Name cannot be blank.",
      },
    })

    expect(dependencies.createComposition).not.toHaveBeenCalled()
  })

  it("trims Composition fields and normalizes blank Composition Description to null", async () => {
    const dependencies = createDependencies({
      createComposition: vi.fn().mockResolvedValue({
        id: VALID_COMPOSITION_ID,
      }),
    })

    await expect(
      submitCreateComposition(
        { role: "editor" },
        {
          code: " silver-900 ",
          name: " Silver (.900) ",
          description: "   ",
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "success",
      message: "Composition added.",
    })

    expect(dependencies.createComposition).toHaveBeenCalledWith({
      code: "silver-900",
      name: "Silver (.900)",
      description: null,
    })
  })

  it("maps duplicate Composition Codes to the Composition Code field", async () => {
    await expect(
      submitCreateComposition(
        { role: "admin" },
        SILVER_COMPOSITION,
        createDependencies({
          createComposition: vi.fn().mockRejectedValue({
            cause: {
              code: "23505",
              constraint_name: "composition_code_lower_unique_idx",
            },
          }),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: COMPOSITION_DUPLICATE_CODE_ERROR,
      },
    })
  })

  it("maps Composition Code slug check failures to the Composition Code field", async () => {
    await expect(
      submitCreateComposition(
        { role: "admin" },
        SILVER_COMPOSITION,
        createDependencies({
          createComposition: vi.fn().mockRejectedValue({
            cause: {
              code: "23514",
              constraint_name: "composition_code_slug_check",
            },
          }),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: COMPOSITION_INVALID_CODE_ERROR,
      },
    })
  })

  it("returns a success result for valid create submissions", async () => {
    const dependencies = createDependencies({
      createComposition: vi.fn().mockResolvedValue({
        id: VALID_COMPOSITION_ID,
      }),
    })

    await expect(
      submitCreateComposition(
        { role: "editor" },
        SILVER_COMPOSITION,
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "success",
      message: "Composition added.",
    })

    expect(dependencies.createComposition).toHaveBeenCalledWith(
      SILVER_COMPOSITION
    )
  })

  it("returns a generic form error for unexpected persistence failures", async () => {
    await expect(
      submitCreateComposition(
        { role: "admin" },
        SILVER_COMPOSITION,
        createDependencies({
          createComposition: vi.fn().mockRejectedValue(new Error("boom")),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: COMPOSITION_GENERIC_SAVE_ERROR,
    })
  })
})

describe("submitUpdateComposition", () => {
  const updateInput = {
    id: VALID_COMPOSITION_ID,
    ...SILVER_COMPOSITION,
  }

  it("returns a missing-row form error when the update target no longer exists", async () => {
    await expect(
      submitUpdateComposition(
        { role: "editor" },
        updateInput,
        updateDependencies({
          updateComposition: vi.fn().mockResolvedValue(null),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: COMPOSITION_MISSING_ERROR,
    })
  })

  it("trims Composition fields before updating a Composition", async () => {
    const dependencies = updateDependencies({
      updateComposition: vi.fn().mockResolvedValue({
        id: VALID_COMPOSITION_ID,
      }),
    })

    await expect(
      submitUpdateComposition(
        { role: "editor" },
        {
          id: VALID_COMPOSITION_ID,
          code: " silver-900 ",
          name: " Silver (.900) ",
          description: "  Ninety percent silver alloy.  ",
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "success",
      message: "Saved.",
    })

    expect(dependencies.updateComposition).toHaveBeenCalledWith({
      id: VALID_COMPOSITION_ID,
      code: "silver-900",
      name: "Silver (.900)",
      description: "Ninety percent silver alloy.",
    })
  })
})

describe("submitDeleteComposition", () => {
  const deleteInput = {
    id: VALID_COMPOSITION_ID,
  }

  it("returns a missing-row form error when the delete target no longer exists", async () => {
    await expect(
      submitDeleteComposition(
        { role: "editor" },
        deleteInput,
        deleteDependencies({
          deleteComposition: vi.fn().mockResolvedValue(null),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: COMPOSITION_MISSING_ERROR,
    })
  })

  it("maps restricted deletes to a Composition-specific form error", async () => {
    await expect(
      submitDeleteComposition(
        { role: "admin" },
        deleteInput,
        deleteDependencies({
          deleteComposition: vi.fn().mockRejectedValue({
            cause: {
              code: "23001",
              constraint_name: "coin_composition_id_composition_id_fk",
            },
          }),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: COMPOSITION_IN_USE_DELETE_ERROR,
    })
  })
})
