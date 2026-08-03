import { z } from "zod"

import { RIM_INVALID_CODE_ERROR } from "./messages"

const RIM_FIELD_NAMES = ["code", "name"] as const

const rimCodeSchema = z
  .string()
  .trim()
  .min(1, "Rim Code cannot be blank.")
  .max(255, "Rim Code must be 255 characters or fewer.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, RIM_INVALID_CODE_ERROR)

const rimNameSchema = z
  .string()
  .trim()
  .min(1, "Rim Name cannot be blank.")
  .max(255, "Rim Name must be 255 characters or fewer.")

export const createRimInputSchema = z.object({
  code: rimCodeSchema,
  name: rimNameSchema,
})

export const updateRimInputSchema = createRimInputSchema.extend({
  id: z.uuid(),
  etag: z.string().min(1),
})

export const deleteRimInputSchema = z.object({
  id: z.uuid(),
  etag: z.string().min(1),
})

type RimFieldName = (typeof RIM_FIELD_NAMES)[number]

export type RimFieldErrors = Partial<Record<RimFieldName, string>>
export type CreateRimInput = z.input<typeof createRimInputSchema>
export type CreateRimData = z.output<typeof createRimInputSchema>
export type UpdateRimInput = z.input<typeof updateRimInputSchema>
export type UpdateRimData = z.output<typeof updateRimInputSchema>
export type DeleteRimInput = z.input<typeof deleteRimInputSchema>
export type DeleteRimData = z.output<typeof deleteRimInputSchema>

function isRimFieldName(field: unknown): field is RimFieldName {
  switch (field) {
    case "code":
    case "name":
      return true
    default:
      return false
  }
}

export function getRimFieldErrors(issues: z.ZodIssue[]): RimFieldErrors {
  const fieldErrors: RimFieldErrors = {}

  for (const issue of issues) {
    const field = issue.path.at(0)

    if (isRimFieldName(field) && fieldErrors[field] === undefined) {
      fieldErrors[field] = issue.message
    }
  }

  return fieldErrors
}

export function validateRimInput<TSchema extends z.ZodType>(
  schema: TSchema,
  input: z.input<TSchema>
):
  | { success: true; data: z.output<TSchema> }
  | { success: false; fieldErrors: RimFieldErrors } {
  const parsedInput = schema.safeParse(input)
  return parsedInput.success
    ? { success: true, data: parsedInput.data }
    : {
        success: false,
        fieldErrors: getRimFieldErrors(parsedInput.error.issues),
      }
}
