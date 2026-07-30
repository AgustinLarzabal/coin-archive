import { oc } from "@orpc/contract"
import { z } from "zod"

const codeSchema = z.string().min(1)

export const coinSummarySchema = z.object({
  id: z.uuid(),
  title: z.string(),
  issuer: z.object({ code: z.string(), isoCode: z.string(), name: z.string() }),
  surfaceImages: z.object({
    obverse: z.string().url().nullable(),
    reverse: z.string().url().nullable(),
    edge: z.string().url().nullable(),
  }),
  detailUrl: z.string().url(),
})

export const browseCoinsInputSchema = z.object({
  q: z.string().min(1).optional(),
  issuer: codeSchema.optional(),
  ruler: codeSchema.optional(),
  theme: codeSchema.optional(),
  engraver: codeSchema.optional(),
  distribution: codeSchema.optional(),
  cursor: z.string().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
})

export const browseCoinsOutputSchema = z.object({
  data: z.array(coinSummarySchema),
  nextCursor: z.string().nullable(),
})

export const publicApiContract = {
  coins: {
    browse: oc
      .route({
        method: "GET",
        path: "/api/v1/coins",
        summary: "Browse Coins",
      })
      .input(browseCoinsInputSchema)
      .output(browseCoinsOutputSchema),
  },
}

export type BrowseCoinsInput = z.infer<typeof browseCoinsInputSchema>
export type BrowseCoinsOutput = z.infer<typeof browseCoinsOutputSchema>
