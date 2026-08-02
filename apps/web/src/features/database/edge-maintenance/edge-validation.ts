import { z } from "zod"

import { EDGE_INVALID_CODE_ERROR } from "./messages"

const EDGE_FIELD_NAMES = ["code", "name"] as const

const edgeCodeSchema = z
  .string()
  .trim()
  .min(1, "Edge Code cannot be blank.")
  .max(255, "Edge Code must be 255 characters or fewer.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, EDGE_INVALID_CODE_ERROR)

const edgeNameSchema = z
  .string()
  .trim()
  .min(1, "Edge Name cannot be blank.")
  .max(255, "Edge Name must be 255 characters or fewer.")

export const createEdgeInputSchema = z.object({
  code: edgeCodeSchema,
  name: edgeNameSchema,
})

export const updateEdgeInputSchema = createEdgeInputSchema.extend({
  id: z.uuid(),
  etag: z.string().min(1),
})

export const deleteEdgeInputSchema = z.object({
  id: z.uuid(),
  etag: z.string().min(1),
})

type EdgeFieldName = (typeof EDGE_FIELD_NAMES)[number]

export type EdgeFieldErrors = Partial<Record<EdgeFieldName, string>>
export type CreateEdgeInput = z.input<typeof createEdgeInputSchema>
export type CreateEdgeData = z.output<typeof createEdgeInputSchema>
export type UpdateEdgeInput = z.input<typeof updateEdgeInputSchema>
export type UpdateEdgeData = z.output<typeof updateEdgeInputSchema>
export type DeleteEdgeInput = z.input<typeof deleteEdgeInputSchema>
export type DeleteEdgeData = z.output<typeof deleteEdgeInputSchema>

function isEdgeFieldName(field: unknown): field is EdgeFieldName {
  switch (field) {
    case "code":
    case "name":
      return true
    default:
      return false
  }
}

export function getEdgeFieldErrors(issues: z.ZodIssue[]): EdgeFieldErrors {
  const fieldErrors: EdgeFieldErrors = {}

  for (const issue of issues) {
    const field = issue.path.at(0)

    if (isEdgeFieldName(field) && fieldErrors[field] === undefined) {
      fieldErrors[field] = issue.message
    }
  }

  return fieldErrors
}

export function validateEdgeInput<TSchema extends z.ZodType>(
  schema: TSchema,
  input: z.input<TSchema>
):
  | { success: true; data: z.output<TSchema> }
  | { success: false; fieldErrors: EdgeFieldErrors } {
  const parsedInput = schema.safeParse(input)
  return parsedInput.success
    ? { success: true, data: parsedInput.data }
    : {
        success: false,
        fieldErrors: getEdgeFieldErrors(parsedInput.error.issues),
      }
}
