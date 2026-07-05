import { describe, expect, it } from "vitest"
import { vi } from "vitest"

import {
  MINTING_TECHNIQUE_AUTHORIZATION_ERROR,
  MINTING_TECHNIQUE_DUPLICATE_CODE_ERROR,
  MINTING_TECHNIQUE_GENERIC_SAVE_ERROR,
  MINTING_TECHNIQUE_IN_USE_DELETE_ERROR,
  MINTING_TECHNIQUE_INVALID_CODE_ERROR,
  MINTING_TECHNIQUE_MISSING_ERROR,
  createMintingTechniqueAuthorizationError,
  hasMintingTechniqueMaintenanceAccess,
  submitCreateMintingTechnique,
  submitDeleteMintingTechnique,
  submitUpdateMintingTechnique,
} from "./actions"

const VALID_MINTING_TECHNIQUE_ID = "8bfd8928-cd58-4a23-b13c-969be89f4d88"
const HAMMERED_MINTING_TECHNIQUE = {
  code: "hammered",
  name: "Hammered",
}

function createDependencies(overrides?: {
  createTechnique?: ReturnType<typeof vi.fn>
  deleteTechnique?: ReturnType<typeof vi.fn>
  updateTechnique?: ReturnType<typeof vi.fn>
}) {
  return {
    createTechnique: vi.fn(),
    deleteTechnique: vi.fn(),
    updateTechnique: vi.fn(),
    ...overrides,
  }
}

const authorizationErrorResult = {
  status: "error" as const,
  fieldErrors: {},
  formError: MINTING_TECHNIQUE_AUTHORIZATION_ERROR,
}

describe("createMintingTechniqueAuthorizationError", () => {
  it("returns the Minting Technique authorization error result", () => {
    expect(createMintingTechniqueAuthorizationError()).toStrictEqual({
      status: "error",
      formError: MINTING_TECHNIQUE_AUTHORIZATION_ERROR,
    })
  })
})

describe("hasMintingTechniqueMaintenanceAccess", () => {
  it("rejects signed-out and non-editor Collectors", () => {
    expect(hasMintingTechniqueMaintenanceAccess(null)).toBe(false)
    expect(hasMintingTechniqueMaintenanceAccess({ role: "collector" })).toBe(
      false
    )
    expect(hasMintingTechniqueMaintenanceAccess({ role: null })).toBe(false)
    expect(hasMintingTechniqueMaintenanceAccess({ role: "owner" })).toBe(false)
  })

  it("allows Editors and Admins", () => {
    expect(hasMintingTechniqueMaintenanceAccess({ role: "editor" })).toBe(true)
    expect(hasMintingTechniqueMaintenanceAccess({ role: "admin" })).toBe(true)
  })
})

describe("submitCreateMintingTechnique", () => {
  it("returns an inline authorization error for signed-out or non-editor Collectors", async () => {
    await expect(
      submitCreateMintingTechnique(null, HAMMERED_MINTING_TECHNIQUE)
    ).resolves.toStrictEqual(authorizationErrorResult)

    await expect(
      submitCreateMintingTechnique(
        { role: "collector" },
        HAMMERED_MINTING_TECHNIQUE
      )
    ).resolves.toStrictEqual(authorizationErrorResult)
  })

  it("maps Zod validation issues into typed field errors", async () => {
    const dependencies = createDependencies()

    await expect(
      submitCreateMintingTechnique(
        { role: "editor" },
        {
          code: "Hammered",
          name: " ",
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: MINTING_TECHNIQUE_INVALID_CODE_ERROR,
        name: "Minting Technique Name cannot be blank.",
      },
    })

    expect(dependencies.createTechnique).not.toHaveBeenCalled()
  })

  it("trims Minting Technique fields before creating a Minting Technique", async () => {
    const dependencies = createDependencies({
      createTechnique: vi.fn().mockResolvedValue({
        id: VALID_MINTING_TECHNIQUE_ID,
      }),
    })

    await expect(
      submitCreateMintingTechnique(
        { role: "editor" },
        {
          code: " hammered ",
          name: " Hammered ",
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "success",
      message: "Minting Technique added.",
    })

    expect(dependencies.createTechnique).toHaveBeenCalledWith({
      code: "hammered",
      name: "Hammered",
    })
  })

  it("maps duplicate Minting Technique Codes to the Minting Technique Code field", async () => {
    await expect(
      submitCreateMintingTechnique(
        { role: "admin" },
        HAMMERED_MINTING_TECHNIQUE,
        createDependencies({
          createTechnique: vi.fn().mockRejectedValue({
            cause: {
              code: "23505",
              constraint_name: "technique_code_lower_unique_idx",
            },
          }),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: MINTING_TECHNIQUE_DUPLICATE_CODE_ERROR,
      },
    })
  })

  it("maps Minting Technique Code slug check failures to the Minting Technique Code field", async () => {
    await expect(
      submitCreateMintingTechnique(
        { role: "admin" },
        HAMMERED_MINTING_TECHNIQUE,
        createDependencies({
          createTechnique: vi.fn().mockRejectedValue({
            cause: {
              code: "23514",
              constraint_name: "technique_code_slug_check",
            },
          }),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: MINTING_TECHNIQUE_INVALID_CODE_ERROR,
      },
    })
  })

  it("returns a success result for valid create submissions", async () => {
    const dependencies = createDependencies({
      createTechnique: vi.fn().mockResolvedValue({
        id: VALID_MINTING_TECHNIQUE_ID,
      }),
    })

    await expect(
      submitCreateMintingTechnique(
        { role: "editor" },
        HAMMERED_MINTING_TECHNIQUE,
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "success",
      message: "Minting Technique added.",
    })

    expect(dependencies.createTechnique).toHaveBeenCalledWith(
      HAMMERED_MINTING_TECHNIQUE
    )
  })

  it("returns a generic form error for unexpected persistence failures", async () => {
    await expect(
      submitCreateMintingTechnique(
        { role: "admin" },
        HAMMERED_MINTING_TECHNIQUE,
        createDependencies({
          createTechnique: vi.fn().mockRejectedValue(new Error("boom")),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: MINTING_TECHNIQUE_GENERIC_SAVE_ERROR,
    })
  })
})

describe("submitUpdateMintingTechnique", () => {
  const updateInput = {
    id: VALID_MINTING_TECHNIQUE_ID,
    ...HAMMERED_MINTING_TECHNIQUE,
  }

  it("returns an inline authorization error for signed-out or non-editor update attempts", async () => {
    await expect(
      submitUpdateMintingTechnique(null, updateInput)
    ).resolves.toStrictEqual(authorizationErrorResult)

    await expect(
      submitUpdateMintingTechnique({ role: "collector" }, updateInput)
    ).resolves.toStrictEqual(authorizationErrorResult)
  })

  it("maps Zod update validation issues into typed field errors", async () => {
    const dependencies = createDependencies()

    await expect(
      submitUpdateMintingTechnique(
        { role: "editor" },
        {
          id: VALID_MINTING_TECHNIQUE_ID,
          code: "Hammered",
          name: " ",
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: MINTING_TECHNIQUE_INVALID_CODE_ERROR,
        name: "Minting Technique Name cannot be blank.",
      },
    })

    expect(dependencies.updateTechnique).not.toHaveBeenCalled()
  })

  it("trims Minting Technique fields before updating a Minting Technique", async () => {
    const dependencies = createDependencies({
      updateTechnique: vi.fn().mockResolvedValue({
        id: VALID_MINTING_TECHNIQUE_ID,
      }),
    })

    await expect(
      submitUpdateMintingTechnique(
        { role: "editor" },
        {
          id: VALID_MINTING_TECHNIQUE_ID,
          code: " hammered ",
          name: " Hammered ",
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "success",
      message: "Saved.",
    })

    expect(dependencies.updateTechnique).toHaveBeenCalledWith({
      id: VALID_MINTING_TECHNIQUE_ID,
      code: "hammered",
      name: "Hammered",
    })
  })

  it("returns a missing-row form error when the update target no longer exists", async () => {
    await expect(
      submitUpdateMintingTechnique(
        { role: "editor" },
        updateInput,
        createDependencies({
          updateTechnique: vi.fn().mockResolvedValue(null),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: MINTING_TECHNIQUE_MISSING_ERROR,
    })
  })

  it("maps duplicate Minting Technique Codes to the Minting Technique Code field during update", async () => {
    await expect(
      submitUpdateMintingTechnique(
        { role: "admin" },
        updateInput,
        createDependencies({
          updateTechnique: vi.fn().mockRejectedValue({
            cause: {
              code: "23505",
              constraint_name: "technique_code_lower_unique_idx",
            },
          }),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: MINTING_TECHNIQUE_DUPLICATE_CODE_ERROR,
      },
    })
  })

  it("maps Minting Technique Code slug check failures during update", async () => {
    await expect(
      submitUpdateMintingTechnique(
        { role: "admin" },
        updateInput,
        createDependencies({
          updateTechnique: vi.fn().mockRejectedValue({
            cause: {
              code: "23514",
              constraint_name: "technique_code_slug_check",
            },
          }),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: MINTING_TECHNIQUE_INVALID_CODE_ERROR,
      },
    })
  })

  it("returns a generic form error for unexpected update persistence failures", async () => {
    await expect(
      submitUpdateMintingTechnique(
        { role: "admin" },
        updateInput,
        createDependencies({
          updateTechnique: vi.fn().mockRejectedValue(new Error("boom")),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: MINTING_TECHNIQUE_GENERIC_SAVE_ERROR,
    })
  })
})

describe("submitDeleteMintingTechnique", () => {
  const deleteInput = {
    id: VALID_MINTING_TECHNIQUE_ID,
  }

  it("returns an inline authorization error for signed-out or non-editor delete attempts", async () => {
    await expect(
      submitDeleteMintingTechnique(null, deleteInput)
    ).resolves.toStrictEqual(authorizationErrorResult)

    await expect(
      submitDeleteMintingTechnique({ role: "collector" }, deleteInput)
    ).resolves.toStrictEqual(authorizationErrorResult)
  })

  it("maps validation issues into typed field errors", async () => {
    const dependencies = createDependencies()

    await expect(
      submitDeleteMintingTechnique(
        { role: "editor" },
        { id: "not-a-uuid" },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
    })

    expect(dependencies.deleteTechnique).not.toHaveBeenCalled()
  })

  it("returns a missing-row form error when the delete target no longer exists", async () => {
    await expect(
      submitDeleteMintingTechnique(
        { role: "editor" },
        deleteInput,
        createDependencies({
          deleteTechnique: vi.fn().mockResolvedValue(null),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: MINTING_TECHNIQUE_MISSING_ERROR,
    })
  })

  it("maps in-use delete failures to a Minting Technique form error", async () => {
    await expect(
      submitDeleteMintingTechnique(
        { role: "admin" },
        deleteInput,
        createDependencies({
          deleteTechnique: vi.fn().mockRejectedValue({
            cause: {
              code: "23001",
              constraint_name: "coin_technique_id_technique_id_fk",
            },
          }),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: MINTING_TECHNIQUE_IN_USE_DELETE_ERROR,
    })
  })

  it("returns a success result for valid delete submissions", async () => {
    const dependencies = createDependencies({
      deleteTechnique: vi.fn().mockResolvedValue({
        id: VALID_MINTING_TECHNIQUE_ID,
      }),
    })

    await expect(
      submitDeleteMintingTechnique(
        { role: "editor" },
        deleteInput,
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "success",
      message: "Minting Technique deleted.",
    })

    expect(dependencies.deleteTechnique).toHaveBeenCalledWith(deleteInput)
  })

  it("returns a generic form error for unexpected delete persistence failures", async () => {
    await expect(
      submitDeleteMintingTechnique(
        { role: "admin" },
        deleteInput,
        createDependencies({
          deleteTechnique: vi.fn().mockRejectedValue(new Error("boom")),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: MINTING_TECHNIQUE_GENERIC_SAVE_ERROR,
    })
  })
})
