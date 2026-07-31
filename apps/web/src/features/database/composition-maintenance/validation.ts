import { z } from "zod"

import { COMPOSITION_INVALID_CODE_ERROR } from "./messages"

const COMPOSITION_FIELD_NAMES = ["code", "name"] as const

const compositionCodeSchema = z
  .string()
  .trim()
  .min(1, "Composition Code cannot be blank.")
  .max(255, "Composition Code must be 255 characters or fewer.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, COMPOSITION_INVALID_CODE_ERROR)

const compositionNameSchema = z
  .string()
  .trim()
  .min(1, "Composition Name cannot be blank.")
  .max(255, "Composition Name must be 255 characters or fewer.")

export const createCompositionInputSchema = z.object({
  code: compositionCodeSchema,
  name: compositionNameSchema,
})

export const updateCompositionInputSchema = createCompositionInputSchema.extend(
  {
    id: z.uuid(),
  }
)

export const deleteCompositionInputSchema = z.object({
  id: z.uuid(),
})

type CompositionFieldName = (typeof COMPOSITION_FIELD_NAMES)[number]

export type CompositionFieldErrors = Partial<
  Record<CompositionFieldName, string>
>

function isCompositionFieldName(field: unknown): field is CompositionFieldName {
  switch (field) {
    case "code":
    case "name":
      return true
    default:
      return false
  }
}

export function getCompositionFieldErrors(
  issues: z.ZodIssue[]
): CompositionFieldErrors {
  const fieldErrors: CompositionFieldErrors = {}

  for (const issue of issues) {
    const field = issue.path.at(0)

    if (isCompositionFieldName(field)) {
      fieldErrors[field] = issue.message
    }
  }

  return fieldErrors
}
