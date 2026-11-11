import { z } from "zod"

import { errorResponseSchema, namedSlugResponseSchema } from "./common.js"
import type { slugSchema } from "./common.js"

export type CoinShape = z.infer<typeof slugSchema>
export const shapeListResponseSchema = z.strictObject({
  shapes: z.array(namedSlugResponseSchema),
})
export type ShapeListResponse = z.infer<typeof shapeListResponseSchema>
export const invalidShapeErrorSchema = errorResponseSchema(
  "invalid_shape",
  "Shape Slug is invalid"
)
