import type { z } from "zod"

export const denominationAmountInsertText = (schema: z.ZodString) =>
  schema
    .regex(/^(?:0|[1-9]\d{0,17})(?:\.\d{1,12})?$/)
    .refine((amount) => !/^0(?:\.0+)?$/.test(amount), {
      message: "Denomination amount must be positive",
    })

export const slugInsertText = (schema: z.ZodString) =>
  schema
    .min(3)
    .max(64)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)

export const trimmedInsertText = (label: string) => (schema: z.ZodString) =>
  schema
    .min(1)
    .refine((value) => value === value.trim(), `${label} must be trimmed`)
