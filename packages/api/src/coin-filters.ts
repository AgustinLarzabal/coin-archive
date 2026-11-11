import { z } from "zod"

import { errorResponseSchema } from "./common.js"

export const FACE_VALUE_AMOUNT_QUERY_PATTERN =
  "^(?:[1-9]\\d{0,17}|0\\.\\d{0,11}[1-9]|[1-9]\\d{0,17}\\.\\d{0,11}[1-9])$"

export const faceValueAmountQuerySchema = z
  .string()
  .regex(new RegExp(FACE_VALUE_AMOUNT_QUERY_PATTERN))

export const COIN_LIST_DEFAULT_PAGE = 1
export const COIN_LIST_DEFAULT_PAGE_SIZE = 24
export const COIN_LIST_MAX_PAGE_SIZE = 100

export const coinListPageSchema = z.int().min(1)

export const coinListPageSizeSchema = z
  .int()
  .min(1)
  .max(COIN_LIST_MAX_PAGE_SIZE)

const decimalIntegerQuerySchema = z.string().regex(/^\d+$/).transform(Number)

export const coinListPageQuerySchema =
  decimalIntegerQuerySchema.pipe(coinListPageSchema)

export const coinListPageSizeQuerySchema = decimalIntegerQuerySchema.pipe(
  coinListPageSizeSchema
)

export const invalidFaceValueFilterErrorSchema = errorResponseSchema(
  "invalid_face_value_filter",
  "Face Value filter is invalid"
)

export const invalidMeasurementFilterErrorSchema = errorResponseSchema(
  "invalid_measurement_filter",
  "Measurement filter is invalid"
)

export const invalidYearErrorSchema = errorResponseSchema(
  "invalid_year",
  "Issue Year is invalid"
)

export const invalidPaginationErrorSchema = errorResponseSchema(
  "invalid_pagination",
  "Pagination is invalid"
)
