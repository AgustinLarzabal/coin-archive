import { z } from "zod"

import { COMPOSITION_INVALID_CODE_ERROR } from "./messages"

const COMPOSITION_FIELD_NAMES = ["code", "name", "description"] as const

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

const compositionDescriptionSchema = z
  .string()
  .optional()
  .transform((description) => {
    const trimmedDescription = description?.trim()

    if (!trimmedDescription) {
      return null
    }

    return trimmedDescription
  })

export const createCompositionInputSchema = z.object({
  code: compositionCodeSchema,
  name: compositionNameSchema,
  description: compositionDescriptionSchema,
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
  return (
    typeof field === "string" &&
    COMPOSITION_FIELD_NAMES.includes(field as CompositionFieldName)
  )
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
