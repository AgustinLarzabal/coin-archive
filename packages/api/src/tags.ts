import { z } from "zod"

import { displayTextSchema, errorResponseSchema, slugSchema } from "./common.js"

export const tagResponseSchema = z.strictObject({
  slug: slugSchema,
  name: displayTextSchema(200),
})

export const tagListResponseSchema = z.strictObject({
  tags: z.array(tagResponseSchema),
})

export type TagResponse = z.infer<typeof tagResponseSchema>
export type TagListResponse = z.infer<typeof tagListResponseSchema>

export const invalidTagErrorSchema = errorResponseSchema(
  "invalid_tag",
  "Tag Slug is invalid"
)
