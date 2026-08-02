import { z } from "zod"

import { CURRENCY_INVALID_CODE_ERROR } from "./messages"

const CURRENCY_FIELD_NAMES = ["code", "name", "fullName"] as const

const currencyCodeSchema = z
  .string()
  .trim()
  .min(1, "Currency Code cannot be blank.")
  .max(255, "Currency Code must be 255 characters or fewer.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, CURRENCY_INVALID_CODE_ERROR)

const currencyNameSchema = z
  .string()
  .trim()
  .min(1, "Currency Name cannot be blank.")
  .max(255, "Currency Name must be 255 characters or fewer.")

const currencyFullNameSchema = z
  .string()
  .trim()
  .min(1, "Currency Full Name cannot be blank.")
  .max(255, "Currency Full Name must be 255 characters or fewer.")

export const createCurrencyInputSchema = z.object({
  code: currencyCodeSchema,
  name: currencyNameSchema,
  fullName: currencyFullNameSchema,
})

export const updateCurrencyInputSchema = createCurrencyInputSchema.extend({
  id: z.uuid(),
  etag: z.string().min(1),
})

export const deleteCurrencyInputSchema = z.object({
  id: z.uuid(),
  etag: z.string().min(1),
})

type CurrencyFieldName = (typeof CURRENCY_FIELD_NAMES)[number]

export type CurrencyFieldErrors = Partial<Record<CurrencyFieldName, string>>
export type CreateCurrencyInput = z.input<typeof createCurrencyInputSchema>
export type CreateCurrencyData = z.output<typeof createCurrencyInputSchema>
export type UpdateCurrencyInput = z.input<typeof updateCurrencyInputSchema>
export type UpdateCurrencyData = z.output<typeof updateCurrencyInputSchema>
export type DeleteCurrencyInput = z.input<typeof deleteCurrencyInputSchema>
export type DeleteCurrencyData = z.output<typeof deleteCurrencyInputSchema>

function isCurrencyFieldName(field: unknown): field is CurrencyFieldName {
  switch (field) {
    case "code":
    case "name":
    case "fullName":
      return true
    default:
      return false
  }
}

export function getCurrencyFieldErrors(
  issues: z.ZodIssue[]
): CurrencyFieldErrors {
  const fieldErrors: CurrencyFieldErrors = {}

  for (const issue of issues) {
    const field = issue.path.at(0)

    if (isCurrencyFieldName(field) && fieldErrors[field] === undefined) {
      fieldErrors[field] = issue.message
    }
  }

  return fieldErrors
}

export function validateCurrencyInput<TSchema extends z.ZodType>(
  schema: TSchema,
  input: z.input<TSchema>
):
  | { success: true; data: z.output<TSchema> }
  | { success: false; fieldErrors: CurrencyFieldErrors } {
  const parsedInput = schema.safeParse(input)
  return parsedInput.success
    ? { success: true, data: parsedInput.data }
    : {
        success: false,
        fieldErrors: getCurrencyFieldErrors(parsedInput.error.issues),
      }
}
