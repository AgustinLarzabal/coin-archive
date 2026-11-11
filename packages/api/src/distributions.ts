import { z } from "zod"

import { displayTextSchema, errorResponseSchema, slugSchema } from "./common.js"

export const distributionResponseSchema = z.strictObject({
  slug: slugSchema,
  name: displayTextSchema(200),
})

export const distributionListResponseSchema = z.strictObject({
  distributions: z.array(distributionResponseSchema),
})

export type DistributionResponse = z.infer<typeof distributionResponseSchema>
export type DistributionListResponse = z.infer<
  typeof distributionListResponseSchema
>

export const invalidDistributionErrorSchema = errorResponseSchema(
  "invalid_distribution",
  "Distribution Slug is invalid"
)
