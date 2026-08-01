import type { CatalogueOption } from "@coin-archive/db"

import { createCatalogueFieldErrorResult } from "../catalogue-mutation-errors"
import type { CatalogueMutationResult } from "../catalogue-mutation-errors"
import {
  createCatalogueInputSchema,
  updateCatalogueInputSchema,
  validateCatalogueInput,
} from "../catalogue-validation"

export type CatalogueDraft = {
  code: string
  title: string
}

export const EMPTY_CATALOGUE_DRAFT: CatalogueDraft = {
  code: "",
  title: "",
}

export function createCatalogueDraft(
  catalogue: CatalogueOption
): CatalogueDraft {
  return {
    code: catalogue.code,
    title: catalogue.title,
  }
}

export function normalizeCatalogueDraft(
  draft: CatalogueDraft
): CatalogueDraft {
  return {
    code: draft.code.trim(),
    title: draft.title.trim(),
  }
}

export function hasCatalogueCreateInput(draft: CatalogueDraft) {
  const normalizedDraft = normalizeCatalogueDraft(draft)

  return normalizedDraft.code.length > 0 || normalizedDraft.title.length > 0
}

export function hasCatalogueEditChanges(
  catalogue: CatalogueOption,
  draft: CatalogueDraft
) {
  return draft.code !== catalogue.code || draft.title !== catalogue.title
}

export function validateCatalogueCreateDraft(
  draft: CatalogueDraft
): CatalogueMutationResult | null {
  const validationResult = validateCatalogueInput(
    createCatalogueInputSchema,
    draft
  )

  return validationResult.success
    ? null
    : createCatalogueFieldErrorResult(validationResult.fieldErrors)
}

export function validateCatalogueUpdateDraft(
  catalogueId: string,
  draft: CatalogueDraft
): CatalogueMutationResult | null {
  const validationResult = validateCatalogueInput(updateCatalogueInputSchema, {
    id: catalogueId,
    ...draft,
  })

  return validationResult.success
    ? null
    : createCatalogueFieldErrorResult(validationResult.fieldErrors)
}
