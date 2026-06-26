import { describe, expect, it, vi } from "vitest"

import {
  CURRENCY_AUTHORIZATION_ERROR,
  CURRENCY_DUPLICATE_CODE_ERROR,
  CURRENCY_GENERIC_SAVE_ERROR,
  CURRENCY_IN_USE_DELETE_ERROR,
  CURRENCY_INVALID_CODE_ERROR,
  CURRENCY_MISSING_ERROR,
  hasCurrencyMaintenanceAccess,
  submitCreateCurrency,
  submitDeleteCurrency,
  submitUpdateCurrency,
} from "./currency-maintenance"

const VALID_CURRENCY_ID = "2c717ddb-95a2-4dad-a280-f58a4779aee8"
const UNITED_STATES_DOLLAR = {
  code: "united-states-dollar",
  name: "Dollar",
  fullName: "United States dollar",
}

function createDependencies(overrides?: {
  createCurrency?: ReturnType<typeof vi.fn>
  deleteCurrency?: ReturnType<typeof vi.fn>
  updateCurrency?: ReturnType<typeof vi.fn>
}) {
  return {
    createCurrency: vi.fn(),
    deleteCurrency: vi.fn(),
    updateCurrency: vi.fn(),
    ...overrides,
  }
}

const authorizationErrorResult = {
  status: "error" as const,
  fieldErrors: {},
  formError: CURRENCY_AUTHORIZATION_ERROR,
}

describe("hasCurrencyMaintenanceAccess", () => {
  it("rejects signed-out and non-editor Collectors", () => {
    expect(hasCurrencyMaintenanceAccess(null)).toBe(false)
    expect(hasCurrencyMaintenanceAccess({ role: "collector" })).toBe(false)
    expect(hasCurrencyMaintenanceAccess({ role: null })).toBe(false)
    expect(hasCurrencyMaintenanceAccess({ role: "owner" })).toBe(false)
  })

  it("allows Editors and Admins", () => {
    expect(hasCurrencyMaintenanceAccess({ role: "editor" })).toBe(true)
    expect(hasCurrencyMaintenanceAccess({ role: "admin" })).toBe(true)
  })
})

describe("submitCreateCurrency", () => {
  it("returns an inline authorization error for signed-out or non-editor Collectors", async () => {
    await expect(
      submitCreateCurrency(null, UNITED_STATES_DOLLAR)
    ).resolves.toStrictEqual(authorizationErrorResult)

    await expect(
      submitCreateCurrency({ role: "collector" }, UNITED_STATES_DOLLAR)
    ).resolves.toStrictEqual(authorizationErrorResult)
  })

  it("maps Zod validation issues into typed field errors", async () => {
    const dependencies = createDependencies()

    await expect(
      submitCreateCurrency(
        { role: "editor" },
        {
          code: "United States Dollar",
          name: " ",
          fullName: " ",
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: CURRENCY_INVALID_CODE_ERROR,
        name: "Currency Name cannot be blank.",
        fullName: "Currency Full Name cannot be blank.",
      },
    })

    expect(dependencies.createCurrency).not.toHaveBeenCalled()
  })

  it("trims Currency fields before creating a Currency", async () => {
    const dependencies = createDependencies({
      createCurrency: vi.fn().mockResolvedValue({
        id: VALID_CURRENCY_ID,
      }),
    })

    await expect(
      submitCreateCurrency(
        { role: "editor" },
        {
          code: " united-states-dollar ",
          name: " Dollar ",
          fullName: " United States dollar ",
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "success",
      message: "Currency added.",
    })

    expect(dependencies.createCurrency).toHaveBeenCalledWith({
      code: "united-states-dollar",
      name: "Dollar",
      fullName: "United States dollar",
    })
  })

  it("maps duplicate Currency Codes to the Currency Code field", async () => {
    await expect(
      submitCreateCurrency(
        { role: "admin" },
        UNITED_STATES_DOLLAR,
        createDependencies({
          createCurrency: vi.fn().mockRejectedValue({
            cause: {
              code: "23505",
              constraint_name: "currency_code_lower_unique_idx",
            },
          }),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: CURRENCY_DUPLICATE_CODE_ERROR,
      },
    })
  })

  it("maps Currency Code slug check failures to the Currency Code field", async () => {
    await expect(
      submitCreateCurrency(
        { role: "admin" },
        UNITED_STATES_DOLLAR,
        createDependencies({
          createCurrency: vi.fn().mockRejectedValue({
            cause: {
              code: "23514",
              constraint_name: "currency_code_slug_check",
            },
          }),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: CURRENCY_INVALID_CODE_ERROR,
      },
    })
  })

  it("returns a success result for valid create submissions", async () => {
    const dependencies = createDependencies({
      createCurrency: vi.fn().mockResolvedValue({
        id: VALID_CURRENCY_ID,
      }),
    })

    await expect(
      submitCreateCurrency({ role: "editor" }, UNITED_STATES_DOLLAR, dependencies)
    ).resolves.toStrictEqual({
      status: "success",
      message: "Currency added.",
    })

    expect(dependencies.createCurrency).toHaveBeenCalledWith(
      UNITED_STATES_DOLLAR
    )
  })

  it("returns a generic form error for unexpected persistence failures", async () => {
    await expect(
      submitCreateCurrency(
        { role: "admin" },
        UNITED_STATES_DOLLAR,
        createDependencies({
          createCurrency: vi.fn().mockRejectedValue(new Error("boom")),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: CURRENCY_GENERIC_SAVE_ERROR,
    })
  })
})

describe("submitUpdateCurrency", () => {
  const updateInput = {
    id: VALID_CURRENCY_ID,
    ...UNITED_STATES_DOLLAR,
  }

  it("returns an inline authorization error for signed-out or non-editor update attempts", async () => {
    await expect(
      submitUpdateCurrency(null, updateInput)
    ).resolves.toStrictEqual(authorizationErrorResult)

    await expect(
      submitUpdateCurrency({ role: "collector" }, updateInput)
    ).resolves.toStrictEqual(authorizationErrorResult)
  })

  it("maps Zod update validation issues into typed field errors", async () => {
    const dependencies = createDependencies()

    await expect(
      submitUpdateCurrency(
        { role: "editor" },
        {
          id: VALID_CURRENCY_ID,
          code: "United States Dollar",
          name: " ",
          fullName: " ",
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: CURRENCY_INVALID_CODE_ERROR,
        name: "Currency Name cannot be blank.",
        fullName: "Currency Full Name cannot be blank.",
      },
    })

    expect(dependencies.updateCurrency).not.toHaveBeenCalled()
  })

  it("trims Currency fields before updating a Currency", async () => {
    const dependencies = createDependencies({
      updateCurrency: vi.fn().mockResolvedValue({
        id: VALID_CURRENCY_ID,
      }),
    })

    await expect(
      submitUpdateCurrency(
        { role: "editor" },
        {
          id: VALID_CURRENCY_ID,
          code: " united-states-dollar ",
          name: " Dollar ",
          fullName: " United States dollar ",
        },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "success",
      message: "Saved.",
    })

    expect(dependencies.updateCurrency).toHaveBeenCalledWith({
      id: VALID_CURRENCY_ID,
      code: "united-states-dollar",
      name: "Dollar",
      fullName: "United States dollar",
    })
  })

  it("returns a missing-row form error when the update target no longer exists", async () => {
    await expect(
      submitUpdateCurrency(
        { role: "editor" },
        updateInput,
        createDependencies({
          updateCurrency: vi.fn().mockResolvedValue(null),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: CURRENCY_MISSING_ERROR,
    })
  })

  it("maps duplicate Currency Codes to the Currency Code field during update", async () => {
    await expect(
      submitUpdateCurrency(
        { role: "admin" },
        updateInput,
        createDependencies({
          updateCurrency: vi.fn().mockRejectedValue({
            cause: {
              code: "23505",
              constraint_name: "currency_code_lower_unique_idx",
            },
          }),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: CURRENCY_DUPLICATE_CODE_ERROR,
      },
    })
  })

  it("returns a generic form error for unexpected update persistence failures", async () => {
    await expect(
      submitUpdateCurrency(
        { role: "admin" },
        updateInput,
        createDependencies({
          updateCurrency: vi.fn().mockRejectedValue(new Error("boom")),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: CURRENCY_GENERIC_SAVE_ERROR,
    })
  })
})

describe("submitDeleteCurrency", () => {
  const deleteInput = {
    id: VALID_CURRENCY_ID,
  }

  it("returns an inline authorization error for signed-out or non-editor delete attempts", async () => {
    await expect(
      submitDeleteCurrency(null, deleteInput)
    ).resolves.toStrictEqual(authorizationErrorResult)

    await expect(
      submitDeleteCurrency({ role: "collector" }, deleteInput)
    ).resolves.toStrictEqual(authorizationErrorResult)
  })

  it("maps validation issues into typed field errors", async () => {
    const dependencies = createDependencies()

    await expect(
      submitDeleteCurrency(
        { role: "editor" },
        { id: "not-a-uuid" },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
    })

    expect(dependencies.deleteCurrency).not.toHaveBeenCalled()
  })

  it("returns a missing-row form error when the delete target no longer exists", async () => {
    await expect(
      submitDeleteCurrency(
        { role: "editor" },
        deleteInput,
        createDependencies({
          deleteCurrency: vi.fn().mockResolvedValue(null),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: CURRENCY_MISSING_ERROR,
    })
  })

  it("maps restricted deletes to a Currency-specific form error", async () => {
    await expect(
      submitDeleteCurrency(
        { role: "admin" },
        deleteInput,
        createDependencies({
          deleteCurrency: vi.fn().mockRejectedValue({
            cause: {
              code: "23001",
              constraint_name: "coin_currency_id_currency_id_fk",
            },
          }),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: CURRENCY_IN_USE_DELETE_ERROR,
    })
  })

  it("returns a success result for valid delete submissions", async () => {
    const dependencies = createDependencies({
      deleteCurrency: vi.fn().mockResolvedValue({
        id: VALID_CURRENCY_ID,
      }),
    })

    await expect(
      submitDeleteCurrency({ role: "editor" }, deleteInput, dependencies)
    ).resolves.toStrictEqual({
      status: "success",
      message: "Currency deleted.",
    })

    expect(dependencies.deleteCurrency).toHaveBeenCalledWith(deleteInput)
  })
})
