import { describe, expect, it, vi } from "vitest"

import {
  ENGRAVER_AUTHORIZATION_ERROR,
  ENGRAVER_DUPLICATE_CODE_ERROR,
  ENGRAVER_GENERIC_SAVE_ERROR,
  ENGRAVER_IN_USE_DELETE_ERROR,
  ENGRAVER_INVALID_CODE_ERROR,
  ENGRAVER_MISSING_ERROR,
  hasEngraverMaintenanceAccess,
  submitCreateEngraver,
  submitDeleteEngraver,
  submitUpdateEngraver,
} from "./engraver-maintenance"

const VALID_ENGRAVER_ID = "2c717ddb-95a2-4dad-a280-f58a4779aee8"
const BARTH_ENGRAVER = {
  code: "barth",
  name: "Barth",
}

function createDependencies(overrides?: {
  createEngraver?: ReturnType<typeof vi.fn>
  deleteEngraver?: ReturnType<typeof vi.fn>
  updateEngraver?: ReturnType<typeof vi.fn>
}) {
  return {
    createEngraver: vi.fn(),
    deleteEngraver: vi.fn(),
    updateEngraver: vi.fn(),
    ...overrides,
  }
}

const authorizationErrorResult = {
  status: "error" as const,
  fieldErrors: {},
  formError: ENGRAVER_AUTHORIZATION_ERROR,
}

describe("hasEngraverMaintenanceAccess", () => {
  it("rejects signed-out and non-editor Collectors", () => {
    expect(hasEngraverMaintenanceAccess(null)).toBe(false)
    expect(hasEngraverMaintenanceAccess({ role: "collector" })).toBe(false)
    expect(hasEngraverMaintenanceAccess({ role: null })).toBe(false)
    expect(hasEngraverMaintenanceAccess({ role: "owner" })).toBe(false)
  })

  it("allows Editors and Admins", () => {
    expect(hasEngraverMaintenanceAccess({ role: "editor" })).toBe(true)
    expect(hasEngraverMaintenanceAccess({ role: "admin" })).toBe(true)
  })
})

describe("submitCreateEngraver", () => {
  it("returns an inline authorization error for signed-out or non-editor Collectors", async () => {
    await expect(
      submitCreateEngraver(null, BARTH_ENGRAVER)
    ).resolves.toStrictEqual(authorizationErrorResult)

    await expect(
      submitCreateEngraver({ role: "collector" }, BARTH_ENGRAVER)
    ).resolves.toStrictEqual(authorizationErrorResult)
  })

  it("maps Zod validation issues into typed field errors", async () => {
    const dependencies = createDependencies()

    await expect(
      submitCreateEngraver(
        { role: "editor" },
        {
          code: "Barth",
          name: " ",
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: ENGRAVER_INVALID_CODE_ERROR,
        name: "Engraver Name cannot be blank.",
      },
    })

    expect(dependencies.createEngraver).not.toHaveBeenCalled()
  })

  it("trims Engraver fields before creating an Engraver", async () => {
    const dependencies = createDependencies({
      createEngraver: vi.fn().mockResolvedValue({
        id: "6f18a1db-9096-433b-b3f1-906c772f7a29",
      }),
    })

    await expect(
      submitCreateEngraver(
        { role: "editor" },
        {
          code: " barth ",
          name: " Barth ",
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "success",
      message: "Engraver added.",
    })

    expect(dependencies.createEngraver).toHaveBeenCalledWith({
      code: "barth",
      name: "Barth",
    })
  })

  it("maps duplicate Engraver Codes to the Engraver Code field", async () => {
    await expect(
      submitCreateEngraver(
        { role: "admin" },
        BARTH_ENGRAVER,
        createDependencies({
          createEngraver: vi.fn().mockRejectedValue({
            cause: {
              code: "23505",
              constraint_name: "engraver_code_lower_unique_idx",
            },
          }),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: ENGRAVER_DUPLICATE_CODE_ERROR,
      },
    })
  })

  it("maps Engraver Code slug check failures to the Engraver Code field", async () => {
    await expect(
      submitCreateEngraver(
        { role: "admin" },
        BARTH_ENGRAVER,
        createDependencies({
          createEngraver: vi.fn().mockRejectedValue({
            cause: {
              code: "23514",
              constraint_name: "engraver_code_slug_check",
            },
          }),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: ENGRAVER_INVALID_CODE_ERROR,
      },
    })
  })

  it("returns a success result for valid create submissions", async () => {
    const dependencies = createDependencies({
      createEngraver: vi.fn().mockResolvedValue({
        id: "6f18a1db-9096-433b-b3f1-906c772f7a29",
      }),
    })

    await expect(
      submitCreateEngraver({ role: "editor" }, BARTH_ENGRAVER, dependencies)
    ).resolves.toStrictEqual({
      status: "success",
      message: "Engraver added.",
    })

    expect(dependencies.createEngraver).toHaveBeenCalledWith(BARTH_ENGRAVER)
  })

  it("returns a generic form error for unexpected persistence failures", async () => {
    await expect(
      submitCreateEngraver(
        { role: "admin" },
        BARTH_ENGRAVER,
        createDependencies({
          createEngraver: vi.fn().mockRejectedValue(new Error("boom")),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: ENGRAVER_GENERIC_SAVE_ERROR,
    })
  })
})

describe("submitUpdateEngraver", () => {
  const updateInput = {
    id: VALID_ENGRAVER_ID,
    ...BARTH_ENGRAVER,
  }

  it("returns an inline authorization error for signed-out or non-editor update attempts", async () => {
    await expect(
      submitUpdateEngraver(null, updateInput)
    ).resolves.toStrictEqual(authorizationErrorResult)

    await expect(
      submitUpdateEngraver({ role: "collector" }, updateInput)
    ).resolves.toStrictEqual(authorizationErrorResult)
  })

  it("maps Zod update validation issues into typed field errors", async () => {
    const dependencies = createDependencies()

    await expect(
      submitUpdateEngraver(
        { role: "editor" },
        {
          id: VALID_ENGRAVER_ID,
          code: "Barth",
          name: " ",
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: ENGRAVER_INVALID_CODE_ERROR,
        name: "Engraver Name cannot be blank.",
      },
    })

    expect(dependencies.updateEngraver).not.toHaveBeenCalled()
  })

  it("trims Engraver fields before updating an Engraver", async () => {
    const dependencies = createDependencies({
      updateEngraver: vi.fn().mockResolvedValue({
        id: VALID_ENGRAVER_ID,
      }),
    })

    await expect(
      submitUpdateEngraver(
        { role: "editor" },
        {
          id: VALID_ENGRAVER_ID,
          code: " barth ",
          name: " Barth ",
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "success",
      message: "Saved.",
    })

    expect(dependencies.updateEngraver).toHaveBeenCalledWith({
      id: VALID_ENGRAVER_ID,
      code: "barth",
      name: "Barth",
    })
  })

  it("returns a missing-row form error when the update target no longer exists", async () => {
    await expect(
      submitUpdateEngraver(
        { role: "editor" },
        updateInput,
        createDependencies({
          updateEngraver: vi.fn().mockResolvedValue(null),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: ENGRAVER_MISSING_ERROR,
    })
  })

  it("maps duplicate Engraver Codes to the Engraver Code field during update", async () => {
    await expect(
      submitUpdateEngraver(
        { role: "admin" },
        updateInput,
        createDependencies({
          updateEngraver: vi.fn().mockRejectedValue({
            cause: {
              code: "23505",
              constraint_name: "engraver_code_lower_unique_idx",
            },
          }),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: ENGRAVER_DUPLICATE_CODE_ERROR,
      },
    })
  })

  it("maps Engraver Code slug check failures to the Engraver Code field during update", async () => {
    await expect(
      submitUpdateEngraver(
        { role: "admin" },
        updateInput,
        createDependencies({
          updateEngraver: vi.fn().mockRejectedValue({
            cause: {
              code: "23514",
              constraint_name: "engraver_code_slug_check",
            },
          }),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: ENGRAVER_INVALID_CODE_ERROR,
      },
    })
  })

  it("returns a generic form error for unexpected update persistence failures", async () => {
    await expect(
      submitUpdateEngraver(
        { role: "admin" },
        updateInput,
        createDependencies({
          updateEngraver: vi.fn().mockRejectedValue(new Error("boom")),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: ENGRAVER_GENERIC_SAVE_ERROR,
    })
  })
})

describe("submitDeleteEngraver", () => {
  const deleteInput = {
    id: VALID_ENGRAVER_ID,
  }

  it("returns an inline authorization error for signed-out or non-editor delete attempts", async () => {
    await expect(
      submitDeleteEngraver(null, deleteInput)
    ).resolves.toStrictEqual(authorizationErrorResult)

    await expect(
      submitDeleteEngraver({ role: "collector" }, deleteInput)
    ).resolves.toStrictEqual(authorizationErrorResult)
  })

  it("maps validation issues into typed field errors", async () => {
    const dependencies = createDependencies()

    await expect(
      submitDeleteEngraver(
        { role: "editor" },
        { id: "not-a-uuid" },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
    })

    expect(dependencies.deleteEngraver).not.toHaveBeenCalled()
  })

  it("returns a missing-row form error when the delete target no longer exists", async () => {
    await expect(
      submitDeleteEngraver(
        { role: "editor" },
        deleteInput,
        createDependencies({
          deleteEngraver: vi.fn().mockResolvedValue(null),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: ENGRAVER_MISSING_ERROR,
    })
  })

  it("maps in-use delete failures to the generic Engraver in-use message", async () => {
    await expect(
      submitDeleteEngraver(
        { role: "admin" },
        deleteInput,
        createDependencies({
          deleteEngraver: vi.fn().mockRejectedValue({
            cause: {
              code: "23001",
              constraint_name: "coin_face_engraver_engraver_id_fkey",
            },
          }),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: ENGRAVER_IN_USE_DELETE_ERROR,
    })
  })

  it("returns success when deleting an unused Engraver", async () => {
    const dependencies = createDependencies({
      deleteEngraver: vi.fn().mockResolvedValue({
        id: VALID_ENGRAVER_ID,
      }),
    })

    await expect(
      submitDeleteEngraver({ role: "editor" }, deleteInput, dependencies)
    ).resolves.toStrictEqual({
      status: "success",
      message: "Engraver deleted.",
    })

    expect(dependencies.deleteEngraver).toHaveBeenCalledWith(deleteInput)
  })
})
