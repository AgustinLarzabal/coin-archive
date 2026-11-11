import { z } from "zod"

import { errorResponseSchema, namedSlugResponseSchema } from "./common.js"

export const tagListResponseSchema = z.strictObject({
  tags: z.array(namedSlugResponseSchema),
})
export type TagListResponse = z.infer<typeof tagListResponseSchema>
export const invalidTagErrorSchema = errorResponseSchema(
  "invalid_tag",
  "Tag Slug is invalid"
)
