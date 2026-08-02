import { z } from "zod"

import { ORIENTATION_INVALID_CODE_ERROR } from "./orientation-mutation-errors"

const ORIENTATION_FIELD_NAMES = ["code", "name"] as const

const orientationCodeSchema = z
  .string()
  .trim()
  .min(1, "Orientation Code cannot be blank.")
  .max(255, "Orientation Code must be 255 characters or fewer.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, ORIENTATION_INVALID_CODE_ERROR)

const orientationNameSchema = z
  .string()
  .trim()
  .min(1, "Orientation Name cannot be blank.")
  .max(255, "Orientation Name must be 255 characters or fewer.")

export const createOrientationInputSchema = z.object({
  code: orientationCodeSchema,
  name: orientationNameSchema,
})

export const updateOrientationInputSchema = createOrientationInputSchema.extend(
  {
    id: z.uuid(),
    etag: z.string().min(1),
  }
)

export const deleteOrientationInputSchema = z.object({
  id: z.uuid(),
  etag: z.string().min(1),
})

type OrientationFieldName = (typeof ORIENTATION_FIELD_NAMES)[number]

export type OrientationFieldErrors = Partial<
  Record<OrientationFieldName, string>
>
export type CreateOrientationInput = z.input<
  typeof createOrientationInputSchema
>
export type UpdateOrientationInput = z.input<
  typeof updateOrientationInputSchema
>
export type DeleteOrientationInput = z.input<
  typeof deleteOrientationInputSchema
>

function isOrientationFieldName(field: unknown): field is OrientationFieldName {
  return (
    typeof field === "string" &&
    ORIENTATION_FIELD_NAMES.includes(field as OrientationFieldName)
  )
}

function getOrientationFieldErrors(
  issues: z.ZodIssue[]
): OrientationFieldErrors {
  const fieldErrors: OrientationFieldErrors = {}

  for (const issue of issues) {
    const field = issue.path.at(0)

    if (isOrientationFieldName(field)) {
      fieldErrors[field] = issue.message
    }
  }

  return fieldErrors
}

export function validateOrientationInput<TSchema extends z.ZodType>(
  schema: TSchema,
  input: z.input<TSchema>
):
  | { success: true; data: z.output<TSchema> }
  | { success: false; fieldErrors: OrientationFieldErrors } {
  const parsedInput = schema.safeParse(input)

  return parsedInput.success
    ? { success: true, data: parsedInput.data }
    : {
        success: false,
        fieldErrors: getOrientationFieldErrors(parsedInput.error.issues),
      }
}
