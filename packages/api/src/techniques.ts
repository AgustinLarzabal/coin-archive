import { z } from "zod"

import { errorResponseSchema, namedSlugResponseSchema } from "./common.js"

export const techniqueListResponseSchema = z.strictObject({
  techniques: z.array(namedSlugResponseSchema),
})
export type TechniqueListResponse = z.infer<typeof techniqueListResponseSchema>
export const invalidTechniqueErrorSchema = errorResponseSchema(
  "invalid_technique",
  "Coin Technique is invalid"
)
