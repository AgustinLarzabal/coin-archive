import { createRoute, z } from "@hono/zod-openapi"
import {
  COIN_LIST_DEFAULT_PAGE,
  COIN_LIST_DEFAULT_PAGE_SIZE,
  COIN_LIST_MAX_PAGE_SIZE,
  COIN_LIST_YEAR_QUERY_PATTERN,
  coinDetailResponseSchema,
  coinDistributionSchema,
  coinFaceValueResponseSchema,
  coinIdSchema,
  coinListItemResponseSchema as sharedCoinListItemResponseSchema,
  coinListPageQuerySchema,
  coinListPageSizeQuerySchema,
  coinListResponseSchema as sharedCoinListResponseSchema,
  coinListYearQuerySchema,
  coinListYearToInterval,
  coinNotFoundErrorSchema as sharedCoinNotFoundErrorSchema,
  currencyResponseSchema,
  currencySlugSchema,
  engraverSlugSchema,
  FACE_VALUE_AMOUNT_QUERY_PATTERN,
  faceValueAmountQuerySchema,
  invalidCoinIdErrorSchema as sharedInvalidCoinIdErrorSchema,
  invalidDistributionErrorSchema as sharedInvalidDistributionErrorSchema,
  invalidEngraverSlugErrorSchema as sharedInvalidEngraverSlugErrorSchema,
  invalidFaceValueFilterErrorSchema as sharedInvalidFaceValueFilterErrorSchema,
  invalidIssuerCodeErrorSchema as sharedInvalidIssuerCodeErrorSchema,
  invalidPaginationErrorSchema as sharedInvalidPaginationErrorSchema,
  invalidRulingAuthoritySlugErrorSchema as sharedInvalidRulingAuthoritySlugErrorSchema,
  invalidYearErrorSchema as sharedInvalidYearErrorSchema,
  issuerCodeSchema,
  issuerResponseSchema,
  missingCoinSurfaceResponse,
  missingCoinSurfaceWithEngraversResponse,
  rulingAuthoritySlugSchema,
} from "@workspace/api"
import { toCurrencyResponse } from "./currency-response.js"
import { internalErrorSchema, responseHeaders } from "./shared.js"
import type { ApiApp } from "./shared.js"
import type {
  CoinDetailResponse,
  CoinFaceValueResponse,
  CoinListItemResponse,
  CoinListResponse,
} from "@workspace/api"
import type {
  Coin,
  CoinListItem,
  CoinListOptions,
  CoinListPage,
} from "@workspace/db"

interface CoinRouteOptions {
  findCoinById?: (coinId: string) => Promise<Coin | null>
  imageBaseUrl?: string
  listCoins?: (options?: CoinListOptions) => Promise<CoinListPage>
}

const issuerSchema = issuerResponseSchema.openapi("Issuer")
const currencySchema = currencyResponseSchema.openapi("Currency")
const faceValueSchema = coinFaceValueResponseSchema
  .safeExtend({ currency: currencySchema })
  .openapi("FaceValue")
const coinSchema = coinDetailResponseSchema
  .safeExtend({
    issuer: issuerSchema,
    faceValue: z.union([faceValueSchema, z.null()]),
  })
  .openapi("Coin")
const coinListItemResponseSchema = sharedCoinListItemResponseSchema
  .safeExtend({
    issuer: issuerSchema,
    faceValue: z.union([faceValueSchema, z.null()]),
  })
  .openapi("CoinListItem")
const coinListResponseSchema = sharedCoinListResponseSchema
  .safeExtend({
    coins: z.array(coinListItemResponseSchema).max(COIN_LIST_MAX_PAGE_SIZE),
  })
  .openapi("CoinListResponse")

const coinListQuerySchema = z
  .object({
    amount: faceValueAmountQuerySchema.optional().openapi({
      description:
        "Exact positive canonical Face Value Amount with at most 18 integer and 12 fractional digits. Requires currency; malformed or repeated values return invalid_face_value_filter",
      param: { name: "amount", in: "query" },
      type: "string",
      pattern: FACE_VALUE_AMOUNT_QUERY_PATTERN,
      example: "0.5",
    }),
    currency: currencySlugSchema.optional().openapi({
      description:
        "Exact, case-sensitive Currency Slug. A valid unknown Slug returns an empty successful page; malformed or repeated values return invalid_face_value_filter",
      param: { name: "currency", in: "query" },
    }),
    distribution: coinDistributionSchema.optional().openapi({
      description: "Exact, case-sensitive Coin Distribution identifier",
      param: { name: "distribution", in: "query" },
    }),
    engraver: engraverSlugSchema.optional().openapi({
      description: "Exact, case-sensitive Engraver Slug",
      param: { name: "engraver", in: "query" },
    }),
    issuer: issuerCodeSchema.optional().openapi({
      description: "Exact, case-sensitive Issuer Code",
      param: { name: "issuer", in: "query" },
    }),
    ruler: rulingAuthoritySlugSchema.optional().openapi({
      description: "Exact, case-sensitive Ruling Authority Slug",
      param: { name: "ruler", in: "query" },
    }),
    year: coinListYearQuerySchema.optional().openapi({
      description:
        "One signed conventional Issue Year contained by the Coin's Issue Period, or a canonical signed closed range whose inclusive boundaries overlap the Issue Period (for example, -400--300, -25-19, or 1986-1990). Negative values are BCE and positive values are CE. Malformed, zero, reversed, open-ended, and repeated values return invalid_year",
      param: { name: "year", in: "query" },
      type: "string",
      pattern: COIN_LIST_YEAR_QUERY_PATTERN,
    }),
    page: coinListPageQuerySchema.default(COIN_LIST_DEFAULT_PAGE).openapi({
      description: "One-based page number",
      default: COIN_LIST_DEFAULT_PAGE,
      param: { name: "page", in: "query" },
      type: "integer",
      minimum: 1,
    }),
    pageSize: coinListPageSizeQuerySchema
      .default(COIN_LIST_DEFAULT_PAGE_SIZE)
      .openapi({
        description: "Number of Coins per page (maximum 100)",
        default: COIN_LIST_DEFAULT_PAGE_SIZE,
        maximum: COIN_LIST_MAX_PAGE_SIZE,
        minimum: 1,
        param: { name: "pageSize", in: "query" },
        type: "integer",
      }),
  })
  .refine(
    ({ amount, currency }) => amount === undefined || currency !== undefined,
    {
      message: "Amount requires Currency",
      path: ["amount"],
    }
  )

const coinPathParametersSchema = z
  .object({
    coinId: coinIdSchema.openapi({
      param: { name: "coinId", in: "path" },
    }),
  })
  .openapi("CoinPathParameters")

const invalidCoinIdErrorSchema =
  sharedInvalidCoinIdErrorSchema.openapi("InvalidCoinIdError")
const invalidDistributionErrorSchema =
  sharedInvalidDistributionErrorSchema.openapi("InvalidDistributionError")
const invalidFaceValueFilterErrorSchema =
  sharedInvalidFaceValueFilterErrorSchema.openapi("InvalidFaceValueFilterError")
const invalidIssuerCodeErrorSchema = sharedInvalidIssuerCodeErrorSchema.openapi(
  "InvalidIssuerCodeError"
)
const invalidEngraverSlugErrorSchema =
  sharedInvalidEngraverSlugErrorSchema.openapi("InvalidEngraverSlugError")
const invalidPaginationErrorSchema = sharedInvalidPaginationErrorSchema.openapi(
  "InvalidPaginationError"
)
const invalidRulingAuthoritySlugErrorSchema =
  sharedInvalidRulingAuthoritySlugErrorSchema.openapi(
    "InvalidRulingAuthoritySlugError"
  )
const invalidYearErrorSchema =
  sharedInvalidYearErrorSchema.openapi("InvalidYearError")
const invalidCoinListFilterErrorSchema = z.union([
  invalidFaceValueFilterErrorSchema,
  invalidDistributionErrorSchema,
  invalidIssuerCodeErrorSchema,
  invalidEngraverSlugErrorSchema,
  invalidRulingAuthoritySlugErrorSchema,
  invalidYearErrorSchema,
  invalidPaginationErrorSchema,
])
const coinNotFoundErrorSchema =
  sharedCoinNotFoundErrorSchema.openapi("CoinNotFoundError")

const coinDetailRoute = createRoute({
  method: "get",
  path: "/v1/coins/{coinId}",
  request: { params: coinPathParametersSchema },
  responses: {
    200: {
      content: { "application/json": { schema: coinSchema } },
      description: "The requested Coin",
      headers: responseHeaders,
    },
    400: {
      content: { "application/json": { schema: invalidCoinIdErrorSchema } },
      description: "The Coin identifier is malformed",
      headers: responseHeaders,
    },
    404: {
      content: { "application/json": { schema: coinNotFoundErrorSchema } },
      description: "The Coin does not exist",
      headers: responseHeaders,
    },
    500: {
      content: { "application/json": { schema: internalErrorSchema } },
      description: "The Coin lookup failed unexpectedly",
      headers: responseHeaders,
    },
  },
})

const coinListRoute = createRoute({
  method: "get",
  path: "/v1/coins",
  request: { query: coinListQuerySchema },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: coinListResponseSchema,
          examples: {
            filteredByFaceValue: {
              summary: "No Coins match the selected Currency and Amount",
              value: {
                coins: [],
                pagination: {
                  page: 1,
                  pageSize: COIN_LIST_DEFAULT_PAGE_SIZE,
                  totalItems: 0,
                  totalPages: 0,
                },
              },
            },
          },
        },
      },
      description: "A list of Coins",
      headers: responseHeaders,
    },
    400: {
      content: {
        "application/json": {
          schema: invalidCoinListFilterErrorSchema,
          examples: {
            invalidFaceValueFilter: {
              summary: "Amount is missing Currency or is not canonical",
              value: {
                error: {
                  code: "invalid_face_value_filter",
                  message: "Face Value filter is invalid",
                },
              },
            },
          },
        },
      },
      description: "A Coin list filter is malformed",
      headers: responseHeaders,
    },
    500: {
      content: { "application/json": { schema: internalErrorSchema } },
      description: "Failed to list Coins",
      headers: responseHeaders,
    },
  },
})

function toCoinResponseFields(coin: Coin | CoinListItem) {
  return {
    id: coin.id,
    title: coin.title,
    distribution: coin.distribution,
    firstIssueYear: coin.firstIssueYear,
    lastIssueYear: coin.lastIssueYear,
    issuer: { name: coin.issuer.name, code: coin.issuer.code },
    createdAt: coin.createdAt.toISOString(),
    updatedAt: coin.updatedAt.toISOString(),
  }
}

function toPublicImageUrl(imageBaseUrl: string | undefined, imageKey: string) {
  if (!imageBaseUrl) {
    throw new Error("IMAGE_BASE_URL is required for persisted image keys")
  }

  const encodedKey = imageKey.split("/").map(encodeURIComponent).join("/")
  return new URL(encodedKey, `${imageBaseUrl}/`).href
}

function toCoinSurfaceResponse(
  surface: NonNullable<Coin["edge"]>,
  imageBaseUrl: string | undefined
) {
  return {
    description: surface.description,
    imageUrl: surface.imageKey
      ? toPublicImageUrl(imageBaseUrl, surface.imageKey)
      : null,
    createdAt: surface.createdAt.toISOString(),
    updatedAt: surface.updatedAt.toISOString(),
  }
}

function toCoinSurfaceWithEngraversResponse(
  surface: NonNullable<Coin["obverse"]>,
  imageBaseUrl: string | undefined
) {
  return {
    ...toCoinSurfaceResponse(surface, imageBaseUrl),
    engravers: surface.engravers.map((engraver) => ({
      slug: engraver.slug,
      fullName: engraver.fullName,
      createdAt: engraver.createdAt.toISOString(),
      updatedAt: engraver.updatedAt.toISOString(),
    })),
  }
}

function toCoinDetailResponse(
  coin: Coin,
  imageBaseUrl: string | undefined
): CoinDetailResponse {
  return {
    ...toCoinResponseFields(coin),
    faceValue: toCoinFaceValueResponse(coin.denomination),
    rulers: coin.rulingAuthorityAttributions.map(
      ({ slug, name, role, tenure }) => ({ slug, name, role, tenure })
    ),
    obverse: coin.obverse
      ? toCoinSurfaceWithEngraversResponse(coin.obverse, imageBaseUrl)
      : { ...missingCoinSurfaceWithEngraversResponse },
    reverse: coin.reverse
      ? toCoinSurfaceWithEngraversResponse(coin.reverse, imageBaseUrl)
      : { ...missingCoinSurfaceWithEngraversResponse },
    edge: coin.edge
      ? toCoinSurfaceResponse(coin.edge, imageBaseUrl)
      : { ...missingCoinSurfaceResponse },
  }
}

function toCoinFaceValueResponse(
  denomination: Coin["denomination"] | CoinListItem["denomination"]
): CoinFaceValueResponse | null {
  return denomination
    ? {
        label: denomination.label,
        numericValue: Number(denomination.amount),
        currency: toCurrencyResponse(denomination.currency),
      }
    : null
}

function toCoinListItemResponse(
  coin: CoinListItem,
  imageBaseUrl: string | undefined
): CoinListItemResponse {
  return {
    ...toCoinResponseFields(coin),
    faceValue: toCoinFaceValueResponse(coin.denomination),
    obverseImageUrl: coin.obverseImageKey
      ? toPublicImageUrl(imageBaseUrl, coin.obverseImageKey)
      : null,
    reverseImageUrl: coin.reverseImageKey
      ? toPublicImageUrl(imageBaseUrl, coin.reverseImageKey)
      : null,
  }
}

export function registerCoinRoutes(app: ApiApp, options: CoinRouteOptions) {
  app.openAPIRegistry.register("CoinPathParameters", coinPathParametersSchema)

  app.openapi(
    coinListRoute,
    async (context) => {
      const {
        amount: faceValueAmount,
        currency: currencySlug,
        distribution,
        engraver: engraverSlug,
        issuer: issuerCode,
        ruler: rulingAuthoritySlug,
        year,
        page,
        pageSize,
      } = context.req.valid("query")
      const listCoins =
        options.listCoins ?? (async () => ({ coins: [], totalItems: 0 }))
      const { coins, totalItems } = await listCoins({
        ...(faceValueAmount === undefined ? {} : { faceValueAmount }),
        ...(currencySlug === undefined ? {} : { currencySlug }),
        ...(distribution === undefined ? {} : { distribution }),
        ...(engraverSlug === undefined ? {} : { engraverSlug }),
        ...(issuerCode === undefined ? {} : { issuerCode }),
        ...(rulingAuthoritySlug === undefined ? {} : { rulingAuthoritySlug }),
        ...(year === undefined
          ? {}
          : { issueYearInterval: coinListYearToInterval(year) }),
        page,
        pageSize,
      })
      const response = {
        coins: coins
          .slice(0, pageSize)
          .map((coin) => toCoinListItemResponse(coin, options.imageBaseUrl)),
        pagination: {
          page,
          pageSize,
          totalItems,
          totalPages: Math.ceil(totalItems / pageSize),
        },
      } satisfies CoinListResponse

      return context.json(response, 200)
    },
    (result, context) => {
      if (!result.success) {
        const invalidDistribution = result.error.issues.some(
          (issue) => issue.path[0] === "distribution"
        )
        const invalidFaceValue = result.error.issues.some(
          (issue) => issue.path[0] === "amount" || issue.path[0] === "currency"
        )
        const invalidEngraver = result.error.issues.some(
          (issue) => issue.path[0] === "engraver"
        )
        const invalidPagination = result.error.issues.some(
          (issue) => issue.path[0] === "page" || issue.path[0] === "pageSize"
        )
        const invalidRulingAuthority = result.error.issues.some(
          (issue) => issue.path[0] === "ruler"
        )
        const invalidYear = result.error.issues.some(
          (issue) => issue.path[0] === "year"
        )
        return context.json(
          invalidFaceValue
            ? {
                error: {
                  code: "invalid_face_value_filter" as const,
                  message: "Face Value filter is invalid" as const,
                },
              }
            : invalidDistribution
              ? {
                  error: {
                    code: "invalid_distribution" as const,
                    message: "Coin Distribution is invalid" as const,
                  },
                }
              : invalidRulingAuthority
                ? {
                    error: {
                      code: "invalid_ruler_slug" as const,
                      message: "Ruling Authority Slug is invalid" as const,
                    },
                  }
                : invalidEngraver
                  ? {
                      error: {
                        code: "invalid_engraver_slug" as const,
                        message: "Engraver Slug is invalid" as const,
                      },
                    }
                  : invalidYear
                    ? {
                        error: {
                          code: "invalid_year" as const,
                          message: "Issue Year is invalid" as const,
                        },
                      }
                    : invalidPagination
                      ? {
                          error: {
                            code: "invalid_pagination" as const,
                            message: "Pagination is invalid" as const,
                          },
                        }
                      : {
                          error: {
                            code: "invalid_issuer_code" as const,
                            message: "Issuer Code is invalid" as const,
                          },
                        },
          400
        )
      }
    }
  )

  app.openapi(
    coinDetailRoute,
    async (context) => {
      const { coinId } = context.req.valid("param")
      const coin = await (options.findCoinById ?? (async () => null))(coinId)

      if (!coin) {
        return context.json(
          {
            error: {
              code: "coin_not_found" as const,
              message: "Coin not found" as const,
            },
          },
          404
        )
      }

      const response = toCoinDetailResponse(
        coin,
        options.imageBaseUrl
      ) satisfies CoinDetailResponse

      return context.json(response, 200)
    },
    (result, context) => {
      if (!result.success) {
        return context.json(
          {
            error: {
              code: "invalid_coin_id" as const,
              message: "Coin ID must be a valid UUID" as const,
            },
          },
          400
        )
      }
    }
  )
}
