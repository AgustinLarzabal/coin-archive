import { z } from "zod"

import { errorResponseSchema } from "./common.js"

export const operationalOkResponseSchema = z.strictObject({
  status: z.literal("ok"),
})

export type OperationalOkResponse = z.infer<typeof operationalOkResponseSchema>

export const operationalUnavailableResponseSchema = z.strictObject({
  status: z.literal("unavailable"),
})

export type OperationalUnavailableResponse = z.infer<
  typeof operationalUnavailableResponseSchema
>
export const internalErrorSchema = errorResponseSchema(
  "internal_error",
  "Internal server error"
)
