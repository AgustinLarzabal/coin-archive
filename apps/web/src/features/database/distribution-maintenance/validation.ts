import { z } from "zod"

import { DISTRIBUTION_INVALID_CODE_ERROR } from "./messages"

const DISTRIBUTION_FIELD_NAMES = ["code", "name"] as const

const distributionCodeSchema = z
  .string()
  .trim()
  .min(1, "Distribution Code cannot be blank.")
  .max(255, "Distribution Code must be 255 characters or fewer.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, DISTRIBUTION_INVALID_CODE_ERROR)

const distributionNameSchema = z
  .string()
  .trim()
  .min(1, "Distribution Name cannot be blank.")
  .max(255, "Distribution Name must be 255 characters or fewer.")

export const createDistributionInputSchema = z.object({
  code: distributionCodeSchema,
  name: distributionNameSchema,
})

export const updateDistributionInputSchema =
  createDistributionInputSchema.extend({
    id: z.uuid(),
    etag: z.string().min(1),
  })

export const deleteDistributionInputSchema = z.object({
  id: z.uuid(),
  etag: z.string().min(1),
})

type DistributionFieldName = (typeof DISTRIBUTION_FIELD_NAMES)[number]

export type DistributionFieldErrors = Partial<
  Record<DistributionFieldName, string>
>
export type CreateDistributionInput = z.input<
  typeof createDistributionInputSchema
>
export type CreateDistributionData = z.output<
  typeof createDistributionInputSchema
>
export type UpdateDistributionInput = z.input<
  typeof updateDistributionInputSchema
>
export type UpdateDistributionData = z.output<
  typeof updateDistributionInputSchema
>
export type DeleteDistributionInput = z.input<
  typeof deleteDistributionInputSchema
>
export type DeleteDistributionData = z.output<
  typeof deleteDistributionInputSchema
>

function isDistributionFieldName(
  field: unknown
): field is DistributionFieldName {
  switch (field) {
    case "code":
    case "name":
      return true
    default:
      return false
  }
}

export function getDistributionFieldErrors(
  issues: z.ZodIssue[]
): DistributionFieldErrors {
  const fieldErrors: DistributionFieldErrors = {}

  for (const issue of issues) {
    const field = issue.path.at(0)

    if (isDistributionFieldName(field) && fieldErrors[field] === undefined) {
      fieldErrors[field] = issue.message
    }
  }

  return fieldErrors
}

export function validateDistributionInput<TSchema extends z.ZodType>(
  schema: TSchema,
  input: z.input<TSchema>
):
  | { success: true; data: z.output<TSchema> }
  | { success: false; fieldErrors: DistributionFieldErrors } {
  const parsedInput = schema.safeParse(input)
  return parsedInput.success
    ? { success: true, data: parsedInput.data }
    : {
        success: false,
        fieldErrors: getDistributionFieldErrors(parsedInput.error.issues),
      }
}
