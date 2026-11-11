import { z } from "zod"

export const operationalOkResponseSchema = z.strictObject({
  status: z.literal("ok"),
})

export const operationalUnavailableResponseSchema = z.strictObject({
  status: z.literal("unavailable"),
})
