import { z } from "zod"

import { displayTextSchema, errorResponseSchema, slugSchema } from "./common.js"

export const rulingAuthorityResponseSchema = z.strictObject({
  slug: slugSchema,
  name: displayTextSchema(200),
  role: displayTextSchema(100),
  tenure: displayTextSchema(200).nullable(),
})

export const rulingAuthorityListResponseSchema = z.strictObject({
  rulers: z.array(rulingAuthorityResponseSchema),
})

export type RulingAuthorityResponse = z.infer<
  typeof rulingAuthorityResponseSchema
>
export type RulingAuthorityListResponse = z.infer<
  typeof rulingAuthorityListResponseSchema
>

export const invalidRulingAuthoritySlugErrorSchema = errorResponseSchema(
  "invalid_ruler_slug",
  "Ruling Authority Slug is invalid"
)
