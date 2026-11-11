import { z } from "zod"

import { displayTextSchema, errorResponseSchema, slugSchema } from "./common.js"

export const orientationResponseSchema = z.strictObject({
  slug: slugSchema,
  name: displayTextSchema(200),
})

export const orientationListResponseSchema = z.strictObject({
  orientations: z.array(orientationResponseSchema),
})

export type OrientationResponse = z.infer<typeof orientationResponseSchema>
export type OrientationListResponse = z.infer<
  typeof orientationListResponseSchema
>

export const invalidOrientationErrorSchema = errorResponseSchema(
  "invalid_orientation",
  "Orientation Slug is invalid"
)
