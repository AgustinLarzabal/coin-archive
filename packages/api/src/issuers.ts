import { z } from "zod"

import { displayTextSchema, errorResponseSchema } from "./common.js"

export const issuerCodeSchema = z
  .string()
  .regex(/^(?:[A-Z]{2}|[A-Z0-9-]{3,12})$/)

export const issuerResponseSchema = z.strictObject({
  name: displayTextSchema(200),
  code: issuerCodeSchema,
})

export const issuerListResponseSchema = z.strictObject({
  issuers: z.array(issuerResponseSchema),
})

export type IssuerResponse = z.infer<typeof issuerResponseSchema>
export type IssuerListResponse = z.infer<typeof issuerListResponseSchema>

export const invalidIssuerCodeErrorSchema = errorResponseSchema(
  "invalid_issuer_code",
  "Issuer Code is invalid"
)
