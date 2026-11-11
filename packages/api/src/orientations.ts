import { z } from "zod"

import { errorResponseSchema, namedSlugResponseSchema } from "./common.js"
import type { slugSchema } from "./common.js"

export type CoinOrientation = z.infer<typeof slugSchema>
export const coinOrientationListResponseSchema = z.strictObject({
  orientations: z.array(namedSlugResponseSchema),
})
export type CoinOrientationListResponse = z.infer<
  typeof coinOrientationListResponseSchema
>
export const invalidOrientationErrorSchema = errorResponseSchema(
  "invalid_orientation",
  "Orientation Slug is invalid"
)
