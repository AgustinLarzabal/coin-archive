import { z } from "zod"

import { displayTextSchema, errorResponseSchema, slugSchema } from "./common.js"

export const engraverResponseSchema = z.strictObject({
  slug: slugSchema,
  fullName: displayTextSchema(200),
})

export const engraverListResponseSchema = z.strictObject({
  engravers: z.array(engraverResponseSchema),
})

export type EngraverResponse = z.infer<typeof engraverResponseSchema>
export type EngraverListResponse = z.infer<typeof engraverListResponseSchema>

export const invalidEngraverSlugErrorSchema = errorResponseSchema(
  "invalid_engraver_slug",
  "Engraver Slug is invalid"
)
