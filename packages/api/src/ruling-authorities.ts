import { z } from "zod"

import {
  displayTextSchema,
  errorResponseSchema,
  namedSlugResponseSchema,
} from "./common.js"

export const rulingAuthorityListResponseSchema = z.strictObject({
  rulers: z.array(namedSlugResponseSchema),
})

export type RulingAuthorityListResponse = z.infer<
  typeof rulingAuthorityListResponseSchema
>
export const rulingAuthorityAttributionResponseSchema = z.strictObject({
  ...namedSlugResponseSchema.shape,
  role: displayTextSchema(100),
  tenure: displayTextSchema(200).nullable(),
})

export type RulingAuthorityAttributionResponse = z.infer<
  typeof rulingAuthorityAttributionResponseSchema
>
export const invalidRulingAuthoritySlugErrorSchema = errorResponseSchema(
  "invalid_ruler_slug",
  "Ruling Authority Slug is invalid"
)
