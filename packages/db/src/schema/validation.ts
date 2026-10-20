import type { z } from "zod"

export const trimmedInsertText = (label: string) => (schema: z.ZodString) =>
  schema
    .min(1)
    .refine((value) => value === value.trim(), `${label} must be trimmed`)
