import { z } from "zod"

import { RULER_INVALID_CODE_ERROR } from "./ruler-mutation-errors"

const RULER_FIELD_NAMES = ["code", "name", "rulerGroupId"] as const

const rulerCodeSchema = z
  .string()
  .trim()
  .min(1, "Ruler Code cannot be blank.")
  .max(255, "Ruler Code must be 255 characters or fewer.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, RULER_INVALID_CODE_ERROR)
const rulerNameSchema = z
  .string()
  .trim()
  .min(1, "Ruler Name cannot be blank.")
  .max(255, "Ruler Name must be 255 characters or fewer.")
const rulerGroupIdSchema = z
  .string()
  .uuid("Ruler Group must be a valid record.")
  .nullable()

export const createRulerInputSchema = z.object({
  code: rulerCodeSchema,
  name: rulerNameSchema,
  rulerGroupId: rulerGroupIdSchema,
})
export const updateRulerInputSchema = createRulerInputSchema.extend({
  id: z.uuid(),
})
export const deleteRulerInputSchema = z.object({ id: z.uuid() })

type RulerFieldName = (typeof RULER_FIELD_NAMES)[number]
export type RulerFieldErrors = Partial<Record<RulerFieldName, string>>
export type CreateRulerInput = z.input<typeof createRulerInputSchema>
export type CreateRulerData = z.output<typeof createRulerInputSchema>
export type UpdateRulerInput = z.input<typeof updateRulerInputSchema>
export type UpdateRulerData = z.output<typeof updateRulerInputSchema>
export type DeleteRulerInput = z.input<typeof deleteRulerInputSchema>
export type DeleteRulerData = z.output<typeof deleteRulerInputSchema>

export function getRulerFieldErrors(issues: z.ZodIssue[]): RulerFieldErrors {
  const fieldErrors: RulerFieldErrors = {}
  for (const issue of issues) {
    const field = issue.path.at(0)
    if (
      typeof field === "string" &&
      RULER_FIELD_NAMES.includes(field as RulerFieldName)
    ) {
      fieldErrors[field as RulerFieldName] = issue.message
    }
  }
  return fieldErrors
}

export function validateRulerInput<TSchema extends z.ZodType>(
  schema: TSchema,
  input: z.input<TSchema>
):
  | { success: true; data: z.output<TSchema> }
  | { success: false; fieldErrors: RulerFieldErrors } {
  const parsedInput = schema.safeParse(input)
  return parsedInput.success
    ? { success: true, data: parsedInput.data }
    : {
        success: false,
        fieldErrors: getRulerFieldErrors(parsedInput.error.issues),
      }
}
