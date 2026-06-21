import { describe, expect, it, vi } from "vitest"

import {
  CATALOGUE_AUTHORIZATION_ERROR,
  CATALOGUE_DUPLICATE_CODE_ERROR,
  CATALOGUE_GENERIC_SAVE_ERROR,
  CATALOGUE_MISSING_ERROR,
  submitCreateCatalogue,
  submitUpdateCatalogue,
} from "./-database-form"

const VALID_CATALOGUE_ID = "2c717ddb-95a2-4dad-a280-f58a4779aee8"

describe("submitCreateCatalogue", () => {
  it("returns an inline authorization error for signed-out or non-editor Collectors", async () => {
    await expect(
      submitCreateCatalogue(null, {
        code: "KM",
        title: "Standard Catalog of World Coins",
      })
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: CATALOGUE_AUTHORIZATION_ERROR,
    })

    await expect(
      submitCreateCatalogue(
        { role: "collector" },
        {
          code: "KM",
          title: "Standard Catalog of World Coins",
        }
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: CATALOGUE_AUTHORIZATION_ERROR,
    })
  })

  it("maps Zod validation issues into typed field errors", async () => {
    const createCatalogue = vi.fn()

    await expect(
      submitCreateCatalogue(
        { role: "editor" },
        {
          code: "  ",
          title: "".padStart(256, "A"),
        },
        {
          createCatalogue,
          updateCatalogue: vi.fn(),
        }
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: "Catalogue Code cannot be blank",
        title: "Catalogue Title must be 255 characters or fewer",
      },
    })

    expect(createCatalogue).not.toHaveBeenCalled()
  })

  it("maps duplicate Catalogue codes to the Code field", async () => {
    await expect(
      submitCreateCatalogue(
        { role: "admin" },
        {
          code: "KM",
          title: "Standard Catalog of World Coins",
        },
        {
          createCatalogue: vi.fn().mockRejectedValue({
            cause: {
              code: "23505",
              constraint_name: "catalogue_code_lower_unique_idx",
            },
          }),
          updateCatalogue: vi.fn(),
        }
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: CATALOGUE_DUPLICATE_CODE_ERROR,
      },
    })
  })

  it("returns a success result for valid create submissions", async () => {
    const createCatalogue = vi.fn().mockResolvedValue({
      id: VALID_CATALOGUE_ID,
    })

    await expect(
      submitCreateCatalogue(
        { role: "editor" },
        {
          code: "KM",
          title: "Standard Catalog of World Coins",
        },
        {
          createCatalogue,
          updateCatalogue: vi.fn(),
        }
      )
    ).resolves.toStrictEqual({
      status: "success",
      message: "Catalogue added.",
    })

    expect(createCatalogue).toHaveBeenCalledWith({
      code: "KM",
      title: "Standard Catalog of World Coins",
    })
  })
})

describe("submitUpdateCatalogue", () => {
  it("returns a missing-row form error when the update target no longer exists", async () => {
    await expect(
      submitUpdateCatalogue(
        { role: "editor" },
        {
          id: VALID_CATALOGUE_ID,
          code: "KM",
          title: "Standard Catalog of World Coins",
        },
        {
          createCatalogue: vi.fn(),
          updateCatalogue: vi.fn().mockResolvedValue(null),
        }
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
        {
          id: VALID_CATALOGUE_ID,
          code: "KM",
          title: "Standard Catalog of World Coins",
        },
        {
          createCatalogue: vi.fn(),
          updateCatalogue: vi.fn().mockRejectedValue(new Error("boom")),
        }
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: CATALOGUE_GENERIC_SAVE_ERROR,
    })
  })

  it("returns a success result for valid update submissions", async () => {
    const updateCatalogue = vi.fn().mockResolvedValue({
      id: VALID_CATALOGUE_ID,
    })

    await expect(
      submitUpdateCatalogue(
        { role: "editor" },
        {
          id: VALID_CATALOGUE_ID,
          code: "RIC",
          title: "Roman Imperial Coinage",
        },
        {
          createCatalogue: vi.fn(),
          updateCatalogue,
        }
      )
    ).resolves.toStrictEqual({
      status: "success",
      message: "Saved.",
    })

    expect(updateCatalogue).toHaveBeenCalledWith({
      id: VALID_CATALOGUE_ID,
      code: "RIC",
      title: "Roman Imperial Coinage",
    })
  })
})
