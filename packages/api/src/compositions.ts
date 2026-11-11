import { z } from "zod"

import { displayTextSchema, errorResponseSchema, slugSchema } from "./common.js"

export const compositionResponseSchema = z.strictObject({
  slug: slugSchema,
  name: displayTextSchema(200),
})

export const compositionListResponseSchema = z.strictObject({
  compositions: z.array(compositionResponseSchema),
})

export type CompositionResponse = z.infer<typeof compositionResponseSchema>
export type CompositionListResponse = z.infer<
  typeof compositionListResponseSchema
>

export const invalidCompositionErrorSchema = errorResponseSchema(
  "invalid_composition",
  "Coin Composition is invalid"
)
