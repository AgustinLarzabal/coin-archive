import { z } from "zod"

import {
  coinFaceValueResponseSchema,
  coinIdSchema,
  firstIssueYearSchema,
  hasOrderedIssuePeriod,
  lastIssueYearSchema,
} from "./coins.js"
import { displayTextSchema, slugSchema } from "./common.js"
import { engraverResponseSchema } from "./engravers.js"
import { issuerResponseSchema } from "./issuers.js"
import { mintResponseSchema } from "./mints.js"
import { rulingAuthorityResponseSchema } from "./ruling-authorities.js"
import { tagResponseSchema } from "./tags.js"

export const coinSurfaceResponseSchema = z.strictObject({
  description: displayTextSchema(10_000).nullable(),
  imageUrl: z.url().nullable(),
  createdAt: z.iso.datetime().nullable(),
  updatedAt: z.iso.datetime().nullable(),
})

export const coinSurfaceWithEngraversResponseSchema =
  coinSurfaceResponseSchema.extend({
    engravers: z.array(engraverResponseSchema),
  })

export const coinDetailResponseSchema = z
  .strictObject({
    id: coinIdSchema,
    title: displayTextSchema(200),
    slug: slugSchema.nullable().optional(),
    distribution: slugSchema,
    firstIssueYear: firstIssueYearSchema,
    lastIssueYear: lastIssueYearSchema,
    issuer: issuerResponseSchema,
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    orientation: displayTextSchema(200).nullable(),
    shape: slugSchema.nullable(),
    shapeName: displayTextSchema(200).nullable(),
    technique: slugSchema.nullable(),
    techniqueName: displayTextSchema(200).nullable(),
    distributionName: displayTextSchema(200),
    composition: slugSchema.nullable(),
    compositionName: displayTextSchema(200).nullable(),
    compositionDetail: displayTextSchema(10_000).nullable(),
    demonetized: z.boolean().nullable().meta({
      description:
        "True for confirmed formal withdrawal of legal-tender status, false for confirmed absence of withdrawal, null when unverified.",
    }),
    size: z
      .number()
      .positive()
      .nullable()
      .meta({ description: "Coin Size in millimetres; null when unknown." }),
    thickness: z.number().positive().nullable().meta({
      description: "Coin Thickness in millimetres; null when unknown.",
    }),
    weight: z
      .number()
      .positive()
      .nullable()
      .meta({ description: "Coin Weight in grams; null when unknown." }),
    faceValue: coinFaceValueResponseSchema.nullable(),
    obverse: coinSurfaceWithEngraversResponseSchema,
    reverse: coinSurfaceWithEngraversResponseSchema,
    edge: coinSurfaceResponseSchema,
    rulers: z.array(rulingAuthorityResponseSchema),
    mints: z.array(mintResponseSchema),
    tags: z.array(tagResponseSchema),
  })
  .refine(hasOrderedIssuePeriod, "Issue Period must be ordered")

export type CoinDetailResponse = z.infer<typeof coinDetailResponseSchema>

export type CoinSurfaceResponse = z.infer<typeof coinSurfaceResponseSchema>
export type CoinSurfaceWithEngraversResponse = z.infer<
  typeof coinSurfaceWithEngraversResponseSchema
>
