import {
  COIN_LIST_DEFAULT_PAGE,
  COIN_LIST_DEFAULT_PAGE_SIZE,
  COIN_LIST_MAX_PAGE_SIZE,
  COIN_LIST_SIZE_QUERY_PATTERN,
  COIN_LIST_THICKNESS_QUERY_PATTERN,
  COIN_LIST_WEIGHT_QUERY_PATTERN,
  COIN_LIST_YEAR_QUERY_PATTERN,
  coinListPageQuerySchema,
  coinListPageSizeQuerySchema,
  coinListSizeSchema,
  coinListSizeToInterval,
  coinListThicknessSchema,
  coinListThicknessToInterval,
  coinListWeightSchema,
  coinListWeightToInterval,
  coinListYearQuerySchema,
  coinListYearToInterval,
  FACE_VALUE_AMOUNT_QUERY_PATTERN,
  faceValueAmountQuerySchema,
  invalidCompositionErrorSchema as sharedInvalidCompositionErrorSchema,
  invalidCurrencySlugErrorSchema as sharedInvalidCurrencySlugErrorSchema,
  invalidDistributionErrorSchema as sharedInvalidDistributionErrorSchema,
  invalidEngraverSlugErrorSchema as sharedInvalidEngraverSlugErrorSchema,
  invalidFaceValueFilterErrorSchema as sharedInvalidFaceValueFilterErrorSchema,
  invalidIssuerCodeErrorSchema as sharedInvalidIssuerCodeErrorSchema,
  invalidMeasurementFilterErrorSchema as sharedInvalidMeasurementFilterErrorSchema,
  invalidMintSlugErrorSchema as sharedInvalidMintSlugErrorSchema,
  invalidOrientationErrorSchema as sharedInvalidOrientationErrorSchema,
  invalidPaginationErrorSchema as sharedInvalidPaginationErrorSchema,
  invalidRulingAuthoritySlugErrorSchema as sharedInvalidRulingAuthoritySlugErrorSchema,
  invalidShapeErrorSchema as sharedInvalidShapeErrorSchema,
  invalidTagErrorSchema as sharedInvalidTagErrorSchema,
  invalidTechniqueErrorSchema as sharedInvalidTechniqueErrorSchema,
  invalidYearErrorSchema as sharedInvalidYearErrorSchema,
  issuerCodeSchema,
  slugSchema,
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
    composition: slugSchema.optional().openapi({
      description:
        "Exact, case-sensitive Coin Composition Slug. A valid unknown Slug returns an empty successful page; malformed or repeated values return invalid_composition",
      param: { name: "composition", in: "query" },
    }),
    currency: slugSchema.optional().openapi({
      description:
        "Exact, case-sensitive Currency Slug. A valid unknown Slug returns an empty successful page; malformed or repeated values return invalid_currency_slug",
      param: { name: "currency", in: "query" },
    }),
    distribution: slugSchema.optional().openapi({
      description:
        "Exact, case-sensitive Coin Distribution Slug. A valid unknown Slug returns an empty successful page; malformed or repeated values return invalid_distribution",
      param: { name: "distribution", in: "query" },
    }),
    engraver: slugSchema.optional().openapi({
      description: "Exact, case-sensitive Engraver Slug",
      param: { name: "engraver", in: "query" },
    }),
    issuer: issuerCodeSchema.optional().openapi({
      description: "Exact, case-sensitive Issuer Code",
      param: { name: "issuer", in: "query" },
    }),
    mint: slugSchema.optional().openapi({
      description:
        "Exact, case-sensitive Mint Slug. A valid unknown Slug returns an empty successful page; malformed or repeated values return invalid_mint_slug",
      param: { name: "mint", in: "query" },
    }),
    orientation: slugSchema.optional().openapi({
      description:
        "Exact Coin Orientation Slug. A valid unknown Slug returns an empty successful page; malformed or repeated values return invalid_orientation",
      param: { name: "orientation", in: "query" },
    }),
    ruler: slugSchema.optional().openapi({
      description: "Exact, case-sensitive Ruling Authority Slug",
      param: { name: "ruler", in: "query" },
    }),
    shape: slugSchema.optional().openapi({
      description:
        "Exact, case-sensitive Coin Shape Slug. A valid unknown Slug returns an empty successful page; malformed or repeated values return invalid_shape",
      param: { name: "shape", in: "query" },
    }),
    size: coinListSizeSchema.optional().openapi({
      description:
        "Exact Coin Size in millimetres or an inclusive closed range (for example, 25.75 or 20-25.75). Malformed, reversed, open-ended, and repeated values return invalid_measurement_filter",
      param: { name: "size", in: "query" },
      type: "string",
      pattern: COIN_LIST_SIZE_QUERY_PATTERN,
    }),
    tag: z
      .preprocess(
        (value) => (typeof value === "string" ? [value] : value),
        z.array(slugSchema).min(1)
      )
      .optional()
      .openapi({
        description:
          "Repeat tag for multiple exact, case-sensitive Tag Slugs (for example, ?tag=map&tag=flag). Multiple distinct Tags match Coins with all of them by default. A valid unknown Slug returns an empty successful page; malformed or duplicate values return invalid_tag",
        param: { name: "tag", in: "query" },
      }),
    technique: slugSchema.optional().openapi({
      description:
        "Exact, case-sensitive Coin Technique slug. A valid unknown slug returns an empty successful page; malformed or repeated values return invalid_technique",
      param: { name: "technique", in: "query" },
    }),
    thickness: coinListThicknessSchema.optional().openapi({
      description:
        "Exact Coin Thickness in millimetres or an inclusive closed range (for example, 2.2 or 1.5-2.25). Malformed, reversed, open-ended, and repeated values return invalid_measurement_filter",
      param: { name: "thickness", in: "query" },
      type: "string",
      pattern: COIN_LIST_THICKNESS_QUERY_PATTERN,
    }),
    weight: coinListWeightSchema.optional().openapi({
      description:
        "Exact Coin Weight in grams or an inclusive closed range (for example, 8.125 or 8.125-8.5). Malformed, reversed, open-ended, and repeated values return invalid_measurement_filter",
      param: { name: "weight", in: "query" },
      type: "string",
      pattern: COIN_LIST_WEIGHT_QUERY_PATTERN,
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
  .refine(({ tag }) => tag === undefined || new Set(tag).size === tag.length, {
    message: "Duplicate Tag",
    path: ["tag"],
  })
  .refine(
    ({ amount, currency }) => amount === undefined || currency !== undefined,
    {
      message: "Amount requires Currency",
      path: ["amount"],
    }
  )

const invalidCompositionErrorSchema =
  sharedInvalidCompositionErrorSchema.openapi("InvalidCompositionError")
const invalidCurrencySlugErrorSchema =
  sharedInvalidCurrencySlugErrorSchema.openapi("InvalidCurrencySlugError")
const invalidDistributionErrorSchema =
  sharedInvalidDistributionErrorSchema.openapi("InvalidDistributionError")
const invalidEngraverSlugErrorSchema =
  sharedInvalidEngraverSlugErrorSchema.openapi("InvalidEngraverSlugError")
const invalidFaceValueFilterErrorSchema =
  sharedInvalidFaceValueFilterErrorSchema.openapi("InvalidFaceValueFilterError")
const invalidIssuerCodeErrorSchema = sharedInvalidIssuerCodeErrorSchema.openapi(
  "InvalidIssuerCodeError"
)
const invalidMeasurementFilterErrorSchema =
  sharedInvalidMeasurementFilterErrorSchema.openapi(
    "InvalidMeasurementFilterError"
  )
const invalidMintSlugErrorSchema = sharedInvalidMintSlugErrorSchema.openapi(
  "InvalidMintSlugError"
)
const invalidOrientationErrorSchema =
  sharedInvalidOrientationErrorSchema.openapi("InvalidOrientationError")
const invalidPaginationErrorSchema = sharedInvalidPaginationErrorSchema.openapi(
  "InvalidPaginationError"
)
const invalidRulingAuthoritySlugErrorSchema =
  sharedInvalidRulingAuthoritySlugErrorSchema.openapi(
    "InvalidRulingAuthoritySlugError"
  )
const invalidShapeErrorSchema =
  sharedInvalidShapeErrorSchema.openapi("InvalidShapeError")
const invalidTagErrorSchema =
  sharedInvalidTagErrorSchema.openapi("InvalidTagError")
const invalidTechniqueErrorSchema = sharedInvalidTechniqueErrorSchema.openapi(
  "InvalidTechniqueError"
)
const invalidYearErrorSchema =
  sharedInvalidYearErrorSchema.openapi("InvalidYearError")
const invalidCoinListFilterErrorSchema = z.union([
  invalidCompositionErrorSchema,
  invalidCurrencySlugErrorSchema,
  invalidDistributionErrorSchema,
  invalidEngraverSlugErrorSchema,
  invalidFaceValueFilterErrorSchema,
  invalidIssuerCodeErrorSchema,
  invalidMeasurementFilterErrorSchema,
  invalidMintSlugErrorSchema,
  invalidOrientationErrorSchema,
  invalidPaginationErrorSchema,
  invalidRulingAuthoritySlugErrorSchema,
  invalidShapeErrorSchema,
  invalidTagErrorSchema,
  invalidTechniqueErrorSchema,
  invalidYearErrorSchema,
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
            invalidCurrencySlug: {
              summary: "Currency Slug is malformed or repeated",
              value: {
                error: {
                  code: "invalid_currency_slug",
                  message: "Currency Slug is invalid",
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
    fields: ["amount"],
    response: {
      error: {
        code: "invalid_face_value_filter",
        message: "Face Value filter is invalid",
      },
    },
  },
  {
    fields: ["composition"],
    response: {
      error: {
        code: "invalid_composition",
        message: "Composition Slug is invalid",
      },
    },
  },
  {
    fields: ["currency"],
    response: {
      error: {
        code: "invalid_currency_slug",
        message: "Currency Slug is invalid",
      },
    },
  },
  {
    fields: ["distribution"],
    response: {
      error: {
        code: "invalid_distribution",
        message: "Distribution Slug is invalid",
      },
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
    fields: ["mint"],
    response: {
      error: { code: "invalid_mint_slug", message: "Mint Slug is invalid" },
    },
  },
  {
    fields: ["orientation"],
    response: {
      error: {
        code: "invalid_orientation",
        message: "Orientation Slug is invalid",
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
    fields: ["shape"],
    response: {
      error: { code: "invalid_shape", message: "Shape Slug is invalid" },
    },
  },
  {
    fields: ["size", "thickness", "weight"],
    response: {
      error: {
        code: "invalid_measurement_filter",
        message: "Measurement filter is invalid",
      },
    },
  },
  {
    fields: ["tag"],
    response: {
      error: { code: "invalid_tag", message: "Tag Slug is invalid" },
    },
  },
  {
    fields: ["technique"],
    response: {
      error: {
        code: "invalid_technique",
        message: "Technique Slug is invalid",
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
        composition,
        currency: currencySlug,
        distribution,
        engraver: engraverSlug,
        issuer: issuerCode,
        mint: mintSlug,
        orientation,
        ruler: rulingAuthoritySlug,
        shape,
        size,
        tag,
        technique,
        thickness,
        weight,
        year,
        page,
        pageSize,
      } = context.req.valid("query")

      const filters: CoinListOptions = {
        composition,
        currencySlug,
        distribution,
        engraverSlug,
        faceValueAmount,
        issuerCode,
        issueYearInterval:
          year === undefined ? undefined : coinListYearToInterval(year),
        mintSlug,
        orientation,
        rulingAuthoritySlug,
        shape,
        sizeInterval:
          size === undefined ? undefined : coinListSizeToInterval(size),
        tagSlugs: tag,
        technique,
        thicknessInterval:
          thickness === undefined
            ? undefined
            : coinListThicknessToInterval(thickness),
        weightInterval:
          weight === undefined ? undefined : coinListWeightToInterval(weight),
        page,
        pageSize,
      }

      const { coins, totalItems } = options.listCoins
        ? await options.listCoins(filters)
        : { coins: [], totalItems: 0 }

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
