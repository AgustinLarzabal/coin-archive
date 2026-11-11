import { z } from "zod"

import { errorResponseSchema } from "./common.js"

export const issuerCodeSchema = z
  .string()
  .regex(/^(?:[A-Z]{2}|[A-Z0-9-]{3,12})$/)
export function isIsoIssuerCode(code: string) {
  return /^[A-Z]{2}$/.test(code)
}

export const issuerResponseSchema = z.strictObject({
  name: z.string().min(1).max(200),
  code: issuerCodeSchema,
})

export type IssuerResponse = z.infer<typeof issuerResponseSchema>

export const issuerListResponseSchema = z.strictObject({
  issuers: z.array(issuerResponseSchema),
})

export type IssuerListResponse = z.infer<typeof issuerListResponseSchema>
export const invalidIssuerCodeErrorSchema = errorResponseSchema(
  "invalid_issuer_code",
  "Issuer Code is invalid"
)
