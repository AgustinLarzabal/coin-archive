import { z } from "zod"

import { displayTextSchema, errorResponseSchema, slugSchema } from "./common.js"

export const engraverListItemResponseSchema = z.strictObject({
  slug: slugSchema,
  fullName: displayTextSchema(200),
})

export const engraverResponseSchema = engraverListItemResponseSchema.extend({
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

export const engraverListResponseSchema = z.strictObject({
  engravers: z.array(engraverListItemResponseSchema),
})

export type EngraverListItemResponse = z.infer<
  typeof engraverListItemResponseSchema
>
export type EngraverResponse = z.infer<typeof engraverResponseSchema>
export type EngraverListResponse = z.infer<typeof engraverListResponseSchema>

export const invalidEngraverSlugErrorSchema = errorResponseSchema(
  "invalid_engraver_slug",
  "Engraver Slug is invalid"
)
