import { oc } from "@orpc/contract"
import { z } from "zod"

const codeSchema = z.string().min(1)
const namedCodeSchema = z.object({ code: codeSchema, name: z.string() })
const decimalSchema = z.string().regex(/^-?\d+(?:\.\d+)?$/)

export const problemDocumentSchema = z.object({
  type: z.string().url(),
  title: z.string(),
  status: z.number().int(),
  detail: z.string(),
  instance: z.string(),
  invalidParams: z
    .array(z.object({ name: z.string(), reason: z.string() }))
    .optional(),
})

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

const edgeSurfaceSchema = z.object({
  description: z.string().nullable(),
  lettering: z.string().nullable(),
  imageUrl: z.string().url().nullable(),
})

const faceSurfaceSchema = edgeSurfaceSchema.extend({
  engravers: z.array(namedCodeSchema),
})

export const coinDetailSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  comments: z.string().nullable(),
  composition: namedCodeSchema.extend({ description: z.string().nullable() }),
  diameter: decimalSchema.nullable(),
  distribution: namedCodeSchema,
  edge: namedCodeSchema.nullable(),
  faceValue: z.object({
    text: z.string(),
    numericValue: decimalSchema,
    currency: z.object({
      code: codeSchema,
      name: z.string(),
      fullName: z.string(),
    }),
  }),
  isDemonetized: z.boolean().nullable(),
  issuer: z.object({ code: codeSchema, isoCode: z.string(), name: z.string() }),
  minYear: z.number().int().nullable(),
  maxYear: z.number().int().nullable(),
  mintage: decimalSchema.nullable(),
  mints: z.array(namedCodeSchema),
  orientation: namedCodeSchema.nullable(),
  references: z.array(
    z.object({
      catalogue: z.object({ code: codeSchema, title: z.string() }),
      number: z.string(),
    })
  ),
  rim: namedCodeSchema.nullable(),
  rulers: z.array(namedCodeSchema),
  shape: namedCodeSchema.nullable(),
  surfaces: z.object({
    obverse: faceSurfaceSchema.nullable(),
    reverse: faceSurfaceSchema.nullable(),
    edge: edgeSurfaceSchema.nullable(),
  }),
  technique: namedCodeSchema.nullable(),
  themes: z.array(namedCodeSchema),
  thickness: decimalSchema.nullable(),
  weight: decimalSchema.nullable(),
})

export const coinDetailOutputSchema = z.object({ data: coinDetailSchema })

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
    detail: oc
      .route({
        method: "GET",
        path: "/api/v1/coins/{uuid}",
        summary: "Get Coin detail",
      })
      .input(z.object({ uuid: z.uuid() }))
      .output(coinDetailOutputSchema)
      .errors({
        BAD_REQUEST: { status: 400, data: problemDocumentSchema },
        NOT_FOUND: { status: 404, data: problemDocumentSchema },
      }),
  },
}

export type BrowseCoinsInput = z.infer<typeof browseCoinsInputSchema>
export type BrowseCoinsOutput = z.infer<typeof browseCoinsOutputSchema>
export type CoinDetail = z.infer<typeof coinDetailSchema>
export type CoinDetailOutput = z.infer<typeof coinDetailOutputSchema>
