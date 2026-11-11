import { z } from "zod"

import { errorResponseSchema, slugSchema } from "./common.js"

export const engraverResponseSchema = z.strictObject({
  slug: slugSchema,
  fullName: z.string().min(1).max(200),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

export type EngraverResponse = z.infer<typeof engraverResponseSchema>

export const engraverListItemResponseSchema = z.strictObject({
  slug: slugSchema,
  fullName: z.string().min(1).max(200),
})

export type EngraverListItemResponse = z.infer<
  typeof engraverListItemResponseSchema
>

export const engraverListResponseSchema = z.strictObject({
  engravers: z.array(engraverListItemResponseSchema),
})

export type EngraverListResponse = z.infer<typeof engraverListResponseSchema>
export const invalidEngraverSlugErrorSchema = errorResponseSchema(
  "invalid_engraver_slug",
  "Engraver Slug is invalid"
)
