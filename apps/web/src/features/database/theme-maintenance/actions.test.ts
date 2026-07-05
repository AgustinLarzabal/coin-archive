import { describe, expect, it, vi } from "vitest"

import {
  hasThemeMaintenanceAccess,
  submitCreateTheme,
  submitDeleteTheme,
  submitUpdateTheme,
  THEME_AUTHORIZATION_ERROR,
  THEME_DUPLICATE_CODE_ERROR,
  THEME_GENERIC_SAVE_ERROR,
  THEME_IN_USE_DELETE_ERROR,
  THEME_INVALID_CODE_ERROR,
  THEME_MISSING_ERROR,
} from "./actions"

const VALID_THEME_ID = "2c717ddb-95a2-4dad-a280-f58a4779aee8"
const MAP_THEME = {
  code: "map",
  name: "Map",
}

function createDependencies(overrides?: {
  createTheme?: ReturnType<typeof vi.fn>
  deleteTheme?: ReturnType<typeof vi.fn>
  updateTheme?: ReturnType<typeof vi.fn>
}) {
  return {
    createTheme: vi.fn(),
    deleteTheme: vi.fn(),
    updateTheme: vi.fn(),
    ...overrides,
  }
}

const authorizationErrorResult = {
  status: "error" as const,
  fieldErrors: {},
  formError: THEME_AUTHORIZATION_ERROR,
}

describe("hasThemeMaintenanceAccess", () => {
  it("rejects signed-out and non-editor Collectors", () => {
    expect(hasThemeMaintenanceAccess(null)).toBe(false)
    expect(hasThemeMaintenanceAccess({ role: "collector" })).toBe(false)
    expect(hasThemeMaintenanceAccess({ role: null })).toBe(false)
    expect(hasThemeMaintenanceAccess({ role: "owner" })).toBe(false)
  })

  it("allows Editors and Admins", () => {
    expect(hasThemeMaintenanceAccess({ role: "editor" })).toBe(true)
    expect(hasThemeMaintenanceAccess({ role: "admin" })).toBe(true)
  })
})

describe("submitCreateTheme", () => {
  it("returns an inline authorization error for signed-out or non-editor Collectors", async () => {
    await expect(submitCreateTheme(null, MAP_THEME)).resolves.toStrictEqual(
      authorizationErrorResult
    )

    await expect(
      submitCreateTheme({ role: "collector" }, MAP_THEME)
    ).resolves.toStrictEqual(authorizationErrorResult)
  })

  it("maps Zod validation issues into typed field errors", async () => {
    const dependencies = createDependencies()

    await expect(
      submitCreateTheme(
        { role: "editor" },
        {
          code: "Map",
          name: " ",
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: THEME_INVALID_CODE_ERROR,
        name: "Theme Name cannot be blank.",
      },
    })

    expect(dependencies.createTheme).not.toHaveBeenCalled()
  })

  it("trims Theme fields before creating a Theme", async () => {
    const dependencies = createDependencies({
      createTheme: vi.fn().mockResolvedValue({
        id: "6f18a1db-9096-433b-b3f1-906c772f7a29",
      }),
    })

    await expect(
      submitCreateTheme(
        { role: "editor" },
        {
          code: " map ",
          name: " Map ",
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "success",
      message: "Theme added.",
    })

    expect(dependencies.createTheme).toHaveBeenCalledWith({
      code: "map",
      name: "Map",
    })
  })

  it("maps duplicate Theme Codes to the Theme Code field", async () => {
    await expect(
      submitCreateTheme(
        { role: "admin" },
        MAP_THEME,
        createDependencies({
          createTheme: vi.fn().mockRejectedValue({
            cause: {
              code: "23505",
              constraint_name: "theme_code_lower_unique_idx",
            },
          }),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: THEME_DUPLICATE_CODE_ERROR,
      },
    })
  })

  it("maps Theme Code slug check failures to the Theme Code field", async () => {
    await expect(
      submitCreateTheme(
        { role: "admin" },
        MAP_THEME,
        createDependencies({
          createTheme: vi.fn().mockRejectedValue({
            cause: {
              code: "23514",
              constraint_name: "theme_code_slug_check",
            },
          }),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: THEME_INVALID_CODE_ERROR,
      },
    })
  })

  it("returns a success result for valid create submissions", async () => {
    const dependencies = createDependencies({
      createTheme: vi.fn().mockResolvedValue({
        id: "6f18a1db-9096-433b-b3f1-906c772f7a29",
      }),
    })

    await expect(
      submitCreateTheme({ role: "editor" }, MAP_THEME, dependencies)
    ).resolves.toStrictEqual({
      status: "success",
      message: "Theme added.",
    })

    expect(dependencies.createTheme).toHaveBeenCalledWith(MAP_THEME)
  })

  it("returns a generic form error for unexpected persistence failures", async () => {
    await expect(
      submitCreateTheme(
        { role: "admin" },
        MAP_THEME,
        createDependencies({
          createTheme: vi.fn().mockRejectedValue(new Error("boom")),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: THEME_GENERIC_SAVE_ERROR,
    })
  })
})

describe("submitUpdateTheme", () => {
  const updateInput = {
    id: VALID_THEME_ID,
    ...MAP_THEME,
  }

  it("returns an inline authorization error for signed-out or non-editor update attempts", async () => {
    await expect(submitUpdateTheme(null, updateInput)).resolves.toStrictEqual(
      authorizationErrorResult
    )

    await expect(
      submitUpdateTheme({ role: "collector" }, updateInput)
    ).resolves.toStrictEqual(authorizationErrorResult)
  })

  it("maps Zod update validation issues into typed field errors", async () => {
    const dependencies = createDependencies()

    await expect(
      submitUpdateTheme(
        { role: "editor" },
        {
          id: VALID_THEME_ID,
          code: "Map",
          name: " ",
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: THEME_INVALID_CODE_ERROR,
        name: "Theme Name cannot be blank.",
      },
    })

    expect(dependencies.updateTheme).not.toHaveBeenCalled()
  })

  it("trims Theme fields before updating a Theme", async () => {
    const dependencies = createDependencies({
      updateTheme: vi.fn().mockResolvedValue({
        id: VALID_THEME_ID,
      }),
    })

    await expect(
      submitUpdateTheme(
        { role: "editor" },
        {
          id: VALID_THEME_ID,
          code: " map ",
          name: " Map ",
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "success",
      message: "Saved.",
    })

    expect(dependencies.updateTheme).toHaveBeenCalledWith({
      id: VALID_THEME_ID,
      code: "map",
      name: "Map",
    })
  })

  it("returns a missing-row form error when the update target no longer exists", async () => {
    await expect(
      submitUpdateTheme(
        { role: "editor" },
        updateInput,
        createDependencies({
          updateTheme: vi.fn().mockResolvedValue(null),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: THEME_MISSING_ERROR,
    })
  })

  it("maps duplicate Theme Codes to the Theme Code field during update", async () => {
    await expect(
      submitUpdateTheme(
        { role: "admin" },
        updateInput,
        createDependencies({
          updateTheme: vi.fn().mockRejectedValue({
            cause: {
              code: "23505",
              constraint_name: "theme_code_lower_unique_idx",
            },
          }),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: THEME_DUPLICATE_CODE_ERROR,
      },
    })
  })

  it("maps Theme Code slug check failures to the Theme Code field during update", async () => {
    await expect(
      submitUpdateTheme(
        { role: "admin" },
        updateInput,
        createDependencies({
          updateTheme: vi.fn().mockRejectedValue({
            cause: {
              code: "23514",
              constraint_name: "theme_code_slug_check",
            },
          }),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: THEME_INVALID_CODE_ERROR,
      },
    })
  })

  it("returns a success result for valid update submissions", async () => {
    const dependencies = createDependencies({
      updateTheme: vi.fn().mockResolvedValue({
        id: VALID_THEME_ID,
      }),
    })

    await expect(
      submitUpdateTheme({ role: "editor" }, updateInput, dependencies)
    ).resolves.toStrictEqual({
      status: "success",
      message: "Saved.",
    })
  })

  it("returns a generic form error for unexpected update failures", async () => {
    await expect(
      submitUpdateTheme(
        { role: "admin" },
        updateInput,
        createDependencies({
          updateTheme: vi.fn().mockRejectedValue(new Error("boom")),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: THEME_GENERIC_SAVE_ERROR,
    })
  })
})

describe("submitDeleteTheme", () => {
  const deleteInput = {
    id: VALID_THEME_ID,
  }

  it("returns an inline authorization error for signed-out or non-editor delete attempts", async () => {
    await expect(submitDeleteTheme(null, deleteInput)).resolves.toStrictEqual(
      authorizationErrorResult
    )

    await expect(
      submitDeleteTheme({ role: "collector" }, deleteInput)
    ).resolves.toStrictEqual(authorizationErrorResult)
  })

  it("maps invalid Theme ids to typed field errors before deleting", async () => {
    const dependencies = createDependencies()

    await expect(
      submitDeleteTheme(
        { role: "editor" },
        { id: "not-a-uuid" },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
    })

    expect(dependencies.deleteTheme).not.toHaveBeenCalled()
  })

  it("returns a missing-row form error when the delete target no longer exists", async () => {
    await expect(
      submitDeleteTheme(
        { role: "editor" },
        deleteInput,
        createDependencies({
          deleteTheme: vi.fn().mockResolvedValue(null),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: THEME_MISSING_ERROR,
    })
  })

  it("maps in-use Theme deletes to a friendly form error", async () => {
    await expect(
      submitDeleteTheme(
        { role: "admin" },
        deleteInput,
        createDependencies({
          deleteTheme: vi.fn().mockRejectedValue({
            cause: {
              code: "23001",
              constraint_name: "coin_theme_theme_id_theme_id_fk",
            },
          }),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: THEME_IN_USE_DELETE_ERROR,
    })
  })

  it("returns a success result for valid delete submissions", async () => {
    const dependencies = createDependencies({
      deleteTheme: vi.fn().mockResolvedValue({
        id: VALID_THEME_ID,
      }),
    })

    await expect(
      submitDeleteTheme({ role: "editor" }, deleteInput, dependencies)
    ).resolves.toStrictEqual({
      status: "success",
      message: "Theme deleted.",
    })

    expect(dependencies.deleteTheme).toHaveBeenCalledWith(deleteInput)
  })

  it("returns a generic form error for unexpected delete failures", async () => {
    await expect(
      submitDeleteTheme(
        { role: "admin" },
        deleteInput,
        createDependencies({
          deleteTheme: vi.fn().mockRejectedValue(new Error("boom")),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: THEME_GENERIC_SAVE_ERROR,
    })
  })
})
