import { describe, expect, it, vi } from "vitest"

import {
  CATALOGUE_AUTHORIZATION_ERROR,
  hasCatalogueMaintenanceAccess,
  submitCreateCatalogue,
  submitDeleteCatalogue,
  submitUpdateCatalogue,
} from "./actions"
import {
  CATALOGUE_DUPLICATE_CODE_ERROR,
  CATALOGUE_GENERIC_SAVE_ERROR,
  CATALOGUE_IN_USE_DELETE_ERROR,
  CATALOGUE_MISSING_ERROR,
} from "./catalogue-mutation-errors"

const VALID_CATALOGUE_ID = "2c717ddb-95a2-4dad-a280-f58a4779aee8"
const STANDARD_CATALOGUE = {
  code: "KM",
  title: "Standard Catalog of World Coins",
}
const ROMAN_CATALOGUE = {
  code: "RIC",
  title: "Roman Imperial Coinage",
}

function createDependencies(overrides?: {
  createCatalogue?: ReturnType<typeof vi.fn>
}) {
  return {
    createCatalogue: vi.fn(),
    deleteCatalogue: vi.fn(),
    updateCatalogue: vi.fn(),
    ...overrides,
  }
}

function updateDependencies(overrides?: {
  updateCatalogue?: ReturnType<typeof vi.fn>
}) {
  return {
    createCatalogue: vi.fn(),
    deleteCatalogue: vi.fn(),
    updateCatalogue: vi.fn(),
    ...overrides,
  }
}

function deleteDependencies(overrides?: {
  deleteCatalogue?: ReturnType<typeof vi.fn>
}) {
  return {
    createCatalogue: vi.fn(),
    deleteCatalogue: vi.fn(),
    updateCatalogue: vi.fn(),
    ...overrides,
  }
}

const authorizationErrorResult = {
  status: "error" as const,
  fieldErrors: {},
  formError: CATALOGUE_AUTHORIZATION_ERROR,
}

describe("hasCatalogueMaintenanceAccess", () => {
  it("rejects signed-out and non-editor Collectors", () => {
    expect(hasCatalogueMaintenanceAccess(null)).toBe(false)
    expect(hasCatalogueMaintenanceAccess({ role: "collector" })).toBe(false)
    expect(hasCatalogueMaintenanceAccess({ role: null })).toBe(false)
    expect(hasCatalogueMaintenanceAccess({ role: "owner" })).toBe(false)
  })

  it("allows Editors and Admins", () => {
    expect(hasCatalogueMaintenanceAccess({ role: "editor" })).toBe(true)
    expect(hasCatalogueMaintenanceAccess({ role: "admin" })).toBe(true)
  })
})

describe("submitCreateCatalogue", () => {
  it("returns an inline authorization error for signed-out or non-editor Collectors", async () => {
    await expect(
      submitCreateCatalogue(null, STANDARD_CATALOGUE)
    ).resolves.toStrictEqual(authorizationErrorResult)

    await expect(
      submitCreateCatalogue({ role: "collector" }, STANDARD_CATALOGUE)
    ).resolves.toStrictEqual(authorizationErrorResult)
  })

  it("maps Zod validation issues into typed field errors", async () => {
    const dependencies = createDependencies()

    await expect(
      submitCreateCatalogue(
        { role: "editor" },
        {
          code: "  ",
          title: "".padStart(256, "A"),
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: "Catalogue Code cannot be blank.",
        title: "Catalogue Title must be 255 characters or fewer.",
      },
    })

    expect(dependencies.createCatalogue).not.toHaveBeenCalled()
  })

  it("trims Catalogue fields before creating a Catalogue", async () => {
    const dependencies = createDependencies({
      createCatalogue: vi.fn().mockResolvedValue({
        id: VALID_CATALOGUE_ID,
      }),
    })

    await expect(
      submitCreateCatalogue(
        { role: "editor" },
        {
          code: " KM ",
          title: " Standard Catalog of World Coins ",
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "success",
      message: "Catalogue added.",
    })

    expect(dependencies.createCatalogue).toHaveBeenCalledWith(
      STANDARD_CATALOGUE
    )
  })

  it("maps duplicate Catalogue codes to the Code field", async () => {
    await expect(
      submitCreateCatalogue(
        { role: "admin" },
        STANDARD_CATALOGUE,
        createDependencies({
          createCatalogue: vi.fn().mockRejectedValue({
            cause: {
              code: "23505",
              constraint_name: "catalogue_code_lower_unique_idx",
            },
          }),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: CATALOGUE_DUPLICATE_CODE_ERROR,
      },
    })
  })

  it("returns a success result for valid create submissions", async () => {
    const dependencies = createDependencies({
      createCatalogue: vi.fn().mockResolvedValue({
        id: VALID_CATALOGUE_ID,
      }),
    })

    await expect(
      submitCreateCatalogue(
        { role: "editor" },
        STANDARD_CATALOGUE,
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "success",
      message: "Catalogue added.",
    })

    expect(dependencies.createCatalogue).toHaveBeenCalledWith(
      STANDARD_CATALOGUE
    )
  })
})

describe("submitUpdateCatalogue", () => {
  const updateInput = {
    id: VALID_CATALOGUE_ID,
    ...STANDARD_CATALOGUE,
  }

  it("returns an inline authorization error for signed-out or non-editor update attempts", async () => {
    await expect(
      submitUpdateCatalogue(null, updateInput)
    ).resolves.toStrictEqual(authorizationErrorResult)

    await expect(
      submitUpdateCatalogue({ role: "collector" }, updateInput)
    ).resolves.toStrictEqual(authorizationErrorResult)
  })

  it("maps Zod update validation issues into typed field errors", async () => {
    const dependencies = updateDependencies()

    await expect(
      submitUpdateCatalogue(
        { role: "editor" },
        {
          id: VALID_CATALOGUE_ID,
          code: " ",
          title: "".padStart(256, "R"),
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: "Catalogue Code cannot be blank.",
        title: "Catalogue Title must be 255 characters or fewer.",
      },
    })

    expect(dependencies.updateCatalogue).not.toHaveBeenCalled()
  })

  it("returns a missing-row form error when the update target no longer exists", async () => {
    await expect(
      submitUpdateCatalogue(
        { role: "editor" },
        updateInput,
        updateDependencies({
          updateCatalogue: vi.fn().mockResolvedValue(null),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: CATALOGUE_MISSING_ERROR,
    })
  })

  it("returns a generic form error for unexpected persistence failures", async () => {
    await expect(
      submitUpdateCatalogue(
        { role: "admin" },
        updateInput,
        updateDependencies({
          updateCatalogue: vi.fn().mockRejectedValue(new Error("boom")),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: CATALOGUE_GENERIC_SAVE_ERROR,
    })
  })

  it("returns a success result for valid update submissions", async () => {
    const dependencies = updateDependencies({
      updateCatalogue: vi.fn().mockResolvedValue({
        id: VALID_CATALOGUE_ID,
      }),
    })

    await expect(
      submitUpdateCatalogue(
        { role: "editor" },
        {
          id: VALID_CATALOGUE_ID,
          ...ROMAN_CATALOGUE,
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "success",
      message: "Saved.",
    })

    expect(dependencies.updateCatalogue).toHaveBeenCalledWith({
      id: VALID_CATALOGUE_ID,
      ...ROMAN_CATALOGUE,
    })
  })

  it("trims Catalogue fields before updating a Catalogue", async () => {
    const dependencies = updateDependencies({
      updateCatalogue: vi.fn().mockResolvedValue({
        id: VALID_CATALOGUE_ID,
      }),
    })

    await expect(
      submitUpdateCatalogue(
        { role: "editor" },
        {
          id: VALID_CATALOGUE_ID,
          code: " RIC ",
          title: " Roman Imperial Coinage ",
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "success",
      message: "Saved.",
    })

    expect(dependencies.updateCatalogue).toHaveBeenCalledWith({
      id: VALID_CATALOGUE_ID,
      ...ROMAN_CATALOGUE,
    })
  })
})

describe("submitDeleteCatalogue", () => {
  const deleteInput = {
    id: VALID_CATALOGUE_ID,
  }

  it("returns an inline authorization error for signed-out or non-editor delete attempts", async () => {
    await expect(
      submitDeleteCatalogue(null, deleteInput)
    ).resolves.toStrictEqual(authorizationErrorResult)

    await expect(
      submitDeleteCatalogue({ role: "collector" }, deleteInput)
    ).resolves.toStrictEqual(authorizationErrorResult)
  })

  it("maps validation issues into typed field errors", async () => {
    const dependencies = deleteDependencies()

    await expect(
      submitDeleteCatalogue(
        { role: "editor" },
        { id: "not-a-uuid" },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
    })

    expect(dependencies.deleteCatalogue).not.toHaveBeenCalled()
  })

  it("returns a missing-row form error when the delete target no longer exists", async () => {
    await expect(
      submitDeleteCatalogue(
        { role: "editor" },
        deleteInput,
        deleteDependencies({
          deleteCatalogue: vi.fn().mockResolvedValue(null),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: CATALOGUE_MISSING_ERROR,
    })
  })

  it("maps restricted deletes to a form error", async () => {
    await expect(
      submitDeleteCatalogue(
        { role: "admin" },
        deleteInput,
        deleteDependencies({
          deleteCatalogue: vi.fn().mockRejectedValue({
            cause: {
              code: "23001",
              constraint_name: "coin_reference_catalogue_id_catalogue_id_fk",
            },
          }),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: CATALOGUE_IN_USE_DELETE_ERROR,
    })
  })

  it("returns a success result for valid delete submissions", async () => {
    const dependencies = deleteDependencies({
      deleteCatalogue: vi.fn().mockResolvedValue({
        id: VALID_CATALOGUE_ID,
      }),
    })

    await expect(
      submitDeleteCatalogue({ role: "editor" }, deleteInput, dependencies)
    ).resolves.toStrictEqual({
      status: "success",
      message: "Catalogue deleted.",
    })

    expect(dependencies.deleteCatalogue).toHaveBeenCalledWith(deleteInput)
  })
})
