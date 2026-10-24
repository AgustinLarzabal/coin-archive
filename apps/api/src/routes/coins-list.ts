import {
  COIN_LIST_DEFAULT_PAGE,
  COIN_LIST_DEFAULT_PAGE_SIZE,
  COIN_LIST_MAX_PAGE_SIZE,
  COIN_LIST_YEAR_QUERY_PATTERN,
  coinDistributionSchema,
  coinListPageQuerySchema,
  coinListPageSizeQuerySchema,
  coinListYearQuerySchema,
  coinListYearToInterval,
  currencySlugSchema,
  engraverSlugSchema,
  FACE_VALUE_AMOUNT_QUERY_PATTERN,
  faceValueAmountQuerySchema,
  invalidDistributionErrorSchema as sharedInvalidDistributionErrorSchema,
  invalidEngraverSlugErrorSchema as sharedInvalidEngraverSlugErrorSchema,
  invalidFaceValueFilterErrorSchema as sharedInvalidFaceValueFilterErrorSchema,
  invalidIssuerCodeErrorSchema as sharedInvalidIssuerCodeErrorSchema,
  invalidMintSlugErrorSchema as sharedInvalidMintSlugErrorSchema,
  invalidPaginationErrorSchema as sharedInvalidPaginationErrorSchema,
  invalidRulingAuthoritySlugErrorSchema as sharedInvalidRulingAuthoritySlugErrorSchema,
  invalidYearErrorSchema as sharedInvalidYearErrorSchema,
  issuerCodeSchema,
  mintSlugSchema,
  rulingAuthoritySlugSchema,
} from "@coin-archive/api"
import { createRoute, z } from "@hono/zod-openapi"
import {
  coinListResponseSchema,
  toCoinListItemResponse,
} from "./coin-response.js"
import { internalErrorSchema, responseHeaders } from "./shared.js"
import type { ApiApp } from "./shared.js"
import type { CoinListResponse } from "@coin-archive/api"
import type { CoinListOptions, CoinListPage } from "@coin-archive/db"

interface CoinListRouteOptions {
  imageBaseUrl?: string
  listCoins?: (options?: CoinListOptions) => Promise<CoinListPage>
}

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
      description:
        "Exact, case-sensitive Coin Distribution Slug. A valid unknown Slug returns an empty successful page; malformed or repeated values return invalid_distribution",
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
    mint: mintSlugSchema.optional().openapi({
      description:
        "Exact, case-sensitive Mint Slug. A valid unknown Slug returns an empty successful page; malformed or repeated values return invalid_mint_slug",
      param: { name: "mint", in: "query" },
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

const invalidDistributionErrorSchema =
  sharedInvalidDistributionErrorSchema.openapi("InvalidDistributionError")
const invalidFaceValueFilterErrorSchema =
  sharedInvalidFaceValueFilterErrorSchema.openapi("InvalidFaceValueFilterError")
const invalidIssuerCodeErrorSchema = sharedInvalidIssuerCodeErrorSchema.openapi(
  "InvalidIssuerCodeError"
)
const invalidMintSlugErrorSchema = sharedInvalidMintSlugErrorSchema.openapi(
  "InvalidMintSlugError"
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
  invalidMintSlugErrorSchema,
  invalidEngraverSlugErrorSchema,
  invalidRulingAuthoritySlugErrorSchema,
  invalidYearErrorSchema,
  invalidPaginationErrorSchema,
])
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

const validationErrors = [
  {
    fields: ["amount", "currency"],
    response: {
      error: {
        code: "invalid_face_value_filter",
        message: "Face Value filter is invalid",
      },
    },
  },
  {
    fields: ["distribution"],
    response: {
      error: {
        code: "invalid_distribution",
        message: "Coin Distribution is invalid",
      },
    },
  },
  {
    fields: ["ruler"],
    response: {
      error: {
        code: "invalid_ruler_slug",
        message: "Ruling Authority Slug is invalid",
      },
    },
  },
  {
    fields: ["mint"],
    response: {
      error: { code: "invalid_mint_slug", message: "Mint Slug is invalid" },
    },
  },
  {
    fields: ["engraver"],
    response: {
      error: {
        code: "invalid_engraver_slug",
        message: "Engraver Slug is invalid",
      },
    },
  },
  {
    fields: ["year"],
    response: {
      error: { code: "invalid_year", message: "Issue Year is invalid" },
    },
  },
  {
    fields: ["page", "pageSize"],
    response: {
      error: {
        code: "invalid_pagination",
        message: "Pagination is invalid",
      },
    },
  },
] as const

export function registerCoinListRoute(
  app: ApiApp,
  options: CoinListRouteOptions
) {
  app.openapi(
    coinListRoute,
    async (context) => {
      const {
        amount: faceValueAmount,
        currency: currencySlug,
        distribution,
        engraver: engraverSlug,
        issuer: issuerCode,
        mint: mintSlug,
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
        ...(mintSlug === undefined ? {} : { mintSlug }),
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
        const response = validationErrors.find(({ fields }) =>
          result.error.issues.some((issue) =>
            fields.some((field) => field === issue.path[0])
          )
        )?.response ?? {
          error: {
            code: "invalid_issuer_code" as const,
            message: "Issuer Code is invalid" as const,
          },
        }
        return context.json(response, 400)
      }
    }
  )
}
