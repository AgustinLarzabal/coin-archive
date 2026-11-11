import { z } from "zod"

import { displayTextSchema, errorResponseSchema, slugSchema } from "./common.js"
import { issuerResponseSchema } from "./issuers.js"

export const mintResponseSchema = z.strictObject({
  slug: slugSchema,
  name: displayTextSchema(200),
  place: displayTextSchema(200),
  country: issuerResponseSchema,
})

export const mintListResponseSchema = z.strictObject({
  mints: z.array(mintResponseSchema),
})

export type MintResponse = z.infer<typeof mintResponseSchema>
export type MintListResponse = z.infer<typeof mintListResponseSchema>

export const invalidMintSlugErrorSchema = errorResponseSchema(
  "invalid_mint_slug",
  "Mint Slug is invalid"
)
