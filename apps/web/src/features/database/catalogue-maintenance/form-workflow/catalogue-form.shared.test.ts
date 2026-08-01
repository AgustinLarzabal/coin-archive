import { describe, expect, it } from "vitest"

import type { CatalogueOption } from "@coin-archive/db"

import {
  createCatalogueDraft,
  hasCatalogueCreateInput,
  hasCatalogueEditChanges,
  normalizeCatalogueDraft,
  validateCatalogueCreateDraft,
  validateCatalogueUpdateDraft,
} from "./catalogue-form.shared"

const VALID_CATALOGUE_ID = "2c717ddb-95a2-4dad-a280-f58a4779aee8"
const catalogue: CatalogueOption = {
  id: VALID_CATALOGUE_ID,
  code: "KM",
  title: "Standard Catalog of World Coins",
  createdAt: new Date("2026-06-24T12:00:00.000Z"),
  updatedAt: new Date("2026-06-24T12:00:00.000Z"),
}

describe("createCatalogueDraft", () => {
  it("copies the editable Catalogue fields from a selected Catalogue", () => {
    expect(createCatalogueDraft(catalogue)).toStrictEqual({
      code: "KM",
      title: "Standard Catalog of World Coins",
    })
  })
})

describe("normalizeCatalogueDraft", () => {
  it("trims editable Catalogue fields without mutating the draft", () => {
    const draft = {
      code: " KM ",
      title: " Standard Catalog of World Coins ",
    }

    expect(normalizeCatalogueDraft(draft)).toStrictEqual({
      code: "KM",
      title: "Standard Catalog of World Coins",
    })
    expect(draft).toStrictEqual({
      code: " KM ",
      title: " Standard Catalog of World Coins ",
    })
  })
})

describe("hasCatalogueCreateInput", () => {
  it("rejects an empty create draft", () => {
    expect(hasCatalogueCreateInput({ code: " ", title: "" })).toBe(false)
  })

  it("accepts a create draft when either field has started", () => {
    expect(hasCatalogueCreateInput({ code: "KM", title: " " })).toBe(true)
    expect(
      hasCatalogueCreateInput({
        code: " ",
        title: "Standard Catalog of World Coins",
      })
    ).toBe(true)
  })

  it("accepts a create draft when both fields have started", () => {
    expect(
      hasCatalogueCreateInput({
        code: " KM ",
        title: " Standard Catalog of World Coins ",
      })
    ).toBe(true)
  })
})

describe("hasCatalogueEditChanges", () => {
  it("distinguishes unchanged and changed edit drafts", () => {
    expect(
      hasCatalogueEditChanges(catalogue, createCatalogueDraft(catalogue))
    ).toBe(false)
    expect(
      hasCatalogueEditChanges(catalogue, {
        code: "RIC",
        title: catalogue.title,
      })
    ).toBe(true)
    expect(
      hasCatalogueEditChanges(catalogue, {
        code: ` ${catalogue.code} `,
        title: catalogue.title,
      })
    ).toBe(true)
  })
})

describe("validateCatalogueCreateDraft", () => {
  it("maps invalid Code and Title values to field errors", () => {
    expect(
      validateCatalogueCreateDraft({
        code: " ",
        title: "".padStart(256, "A"),
      })
    ).toStrictEqual({
      status: "error",
      fieldErrors: {
        code: "Catalogue Code cannot be blank.",
        title: "Catalogue Title must be 255 characters or fewer.",
      },
    })
  })
})

describe("validateCatalogueUpdateDraft", () => {
  it("accepts a valid Catalogue update", () => {
    expect(
      validateCatalogueUpdateDraft(VALID_CATALOGUE_ID, {
        code: "RIC",
        title: "Roman Imperial Coinage",
      })
    ).toBeNull()
  })

  it("returns the existing empty field-error result for an invalid Catalogue ID", () => {
    expect(
      validateCatalogueUpdateDraft("not-a-uuid", {
        code: "RIC",
        title: "Roman Imperial Coinage",
      })
    ).toStrictEqual({
      status: "error",
      fieldErrors: {},
    })
  })
})
