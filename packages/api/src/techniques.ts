import { z } from "zod"

import { displayTextSchema, errorResponseSchema, slugSchema } from "./common.js"

export const techniqueResponseSchema = z.strictObject({
  slug: slugSchema,
  name: displayTextSchema(200),
})

export const techniqueListResponseSchema = z.strictObject({
  techniques: z.array(techniqueResponseSchema),
})

export type TechniqueResponse = z.infer<typeof techniqueResponseSchema>
export type TechniqueListResponse = z.infer<typeof techniqueListResponseSchema>

export const invalidTechniqueErrorSchema = errorResponseSchema(
  "invalid_technique",
  "Technique Slug is invalid"
)
