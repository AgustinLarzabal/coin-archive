import { z } from "zod"

import { errorResponseSchema, namedSlugResponseSchema } from "./common.js"
import type { slugSchema } from "./common.js"

export type CoinDistribution = z.infer<typeof slugSchema>
export const distributionListResponseSchema = z.strictObject({
  distributions: z.array(namedSlugResponseSchema),
})

export type DistributionListResponse = z.infer<
  typeof distributionListResponseSchema
>
export const invalidDistributionErrorSchema = errorResponseSchema(
  "invalid_distribution",
  "Coin Distribution is invalid"
)
