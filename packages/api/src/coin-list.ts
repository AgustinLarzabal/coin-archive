import { z } from "zod"

import {
  COIN_LIST_MAX_PAGE_SIZE,
  coinListPageSchema,
  coinListPageSizeSchema,
} from "./coin-filters.js"
import {
  coinFaceValueResponseSchema,
  coinIdSchema,
  firstIssueYearSchema,
  hasOrderedIssuePeriod,
  lastIssueYearSchema,
} from "./coins.js"
import { displayTextSchema, slugSchema } from "./common.js"
import { issuerResponseSchema } from "./issuers.js"

const coinListPaginationResponseSchema = z.strictObject({
  page: coinListPageSchema,
  pageSize: coinListPageSizeSchema,
  totalItems: z.int().min(0),
  totalPages: z.int().min(0),
})

export const coinListItemResponseSchema = z
  .strictObject({
    id: coinIdSchema,
    title: displayTextSchema(200),
    distribution: slugSchema,
    firstIssueYear: firstIssueYearSchema,
    lastIssueYear: lastIssueYearSchema,
    issuer: issuerResponseSchema,
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    faceValue: coinFaceValueResponseSchema.nullable(),
    obverseImageUrl: z.url().nullable(),
    reverseImageUrl: z.url().nullable(),
  })
  .refine(hasOrderedIssuePeriod, "Issue Period must be ordered")

export const coinListResponseSchema = z.strictObject({
  coins: z.array(coinListItemResponseSchema).max(COIN_LIST_MAX_PAGE_SIZE),
  pagination: coinListPaginationResponseSchema,
})

export type CoinListItemResponse = z.infer<typeof coinListItemResponseSchema>
export type CoinListResponse = z.infer<typeof coinListResponseSchema>

export type CoinListPaginationResponse = z.infer<
  typeof coinListPaginationResponseSchema
>
