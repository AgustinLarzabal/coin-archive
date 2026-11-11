import { z } from "zod"

import { displayTextSchema, errorResponseSchema, slugSchema } from "./common.js"

export const shapeResponseSchema = z.strictObject({
  slug: slugSchema,
  name: displayTextSchema(200),
})

export const shapeListResponseSchema = z.strictObject({
  shapes: z.array(shapeResponseSchema),
})

export type ShapeResponse = z.infer<typeof shapeResponseSchema>
export type ShapeListResponse = z.infer<typeof shapeListResponseSchema>

export const invalidShapeErrorSchema = errorResponseSchema(
  "invalid_shape",
  "Shape Slug is invalid"
)
