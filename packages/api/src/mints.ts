import { z } from "zod"

import {
  displayTextSchema,
  errorResponseSchema,
  historicalYearSchema,
  slugSchema,
} from "./common.js"
import { issuerResponseSchema } from "./issuers.js"

export const mintResponseSchema = z
  .strictObject({
    id: z.uuid(),
    slug: slugSchema,
    name: displayTextSchema(200),
    place: displayTextSchema(200),
    country: issuerResponseSchema,
    startYear: historicalYearSchema.nullable().meta({
      description:
        "Inclusive signed BCE/CE year without year zero; null when unknown.",
      not: { const: 0 },
    }),
    endYear: historicalYearSchema.nullable().meta({
      description:
        "Inclusive signed BCE/CE year without year zero; null when unknown or ongoing.",
      not: { const: 0 },
    }),
    operating: z.boolean().nullable().meta({
      description:
        "True if operating, false if closed, null if status is unknown. A known end year requires false.",
    }),
  })
  .refine(
    ({ startYear, endYear, operating }) =>
      (startYear === null || endYear === null || startYear <= endYear) &&
      (operating !== true || endYear === null) &&
      (endYear === null || operating === false),
    "Mint Operation Period is invalid"
  )

export type MintResponse = z.infer<typeof mintResponseSchema>

export const mintListResponseSchema = z.strictObject({
  mints: z.array(mintResponseSchema),
})

export type MintListResponse = z.infer<typeof mintListResponseSchema>
export const invalidMintSlugErrorSchema = errorResponseSchema(
  "invalid_mint_slug",
  "Mint Slug is invalid"
)
