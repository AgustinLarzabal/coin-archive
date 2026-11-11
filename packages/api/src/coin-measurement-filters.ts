import { z } from "zod"

export const measurementQuerySchema = (precision: 2 | 3) =>
  z
    .string()
    .regex(new RegExp(`^(?:[1-9]\\d{0,17}|0)(?:\\.\\d{1,${precision}})?$`))
    .refine((value) => Number(value) > 0)

export function measurementMinExceedsMax(min: string, max: string) {
  const scaled = (value: string) => {
    const [whole, fraction = ""] = value.split(".")
    return BigInt(whole) * 1000n + BigInt(fraction.padEnd(3, "0"))
  }
  return scaled(min) > scaled(max)
}

function coinListMeasurementRangeSchema(precision: 2 | 3) {
  const valueSchema = measurementQuerySchema(precision)
  return z.string().refine((value) => {
    const bounds = value.split("-")
    return (
      bounds.length <= 2 &&
      bounds.every((bound) => valueSchema.safeParse(bound).success) &&
      (bounds.length === 1 || !measurementMinExceedsMax(bounds[0], bounds[1]))
    )
  })
}

const COIN_LIST_SIZE_VALUE_QUERY_PATTERN =
  "(?:[1-9]\\d{0,17}(?:\\.\\d{1,2})?|0\\.(?:[1-9]\\d?|0[1-9]))"
export const COIN_LIST_SIZE_QUERY_PATTERN = `^${COIN_LIST_SIZE_VALUE_QUERY_PATTERN}(?:-${COIN_LIST_SIZE_VALUE_QUERY_PATTERN})?$`
export const coinListSizeSchema = coinListMeasurementRangeSchema(2)
export type CoinListSize = z.infer<typeof coinListSizeSchema>

export function coinListSizeToInterval(size: CoinListSize) {
  const [min, max = min] = size.split("-")
  return { min, max }
}

export const COIN_LIST_THICKNESS_QUERY_PATTERN = COIN_LIST_SIZE_QUERY_PATTERN
export const coinListThicknessSchema = coinListSizeSchema
export type CoinListThickness = z.infer<typeof coinListThicknessSchema>
export const coinListThicknessToInterval = coinListSizeToInterval

const COIN_LIST_WEIGHT_VALUE_QUERY_PATTERN =
  "(?:[1-9]\\d{0,17}(?:\\.\\d{1,3})?|0\\.(?:[1-9]\\d{0,2}|0[1-9]\\d?|00[1-9]))"
export const COIN_LIST_WEIGHT_QUERY_PATTERN = `^${COIN_LIST_WEIGHT_VALUE_QUERY_PATTERN}(?:-${COIN_LIST_WEIGHT_VALUE_QUERY_PATTERN})?$`
export const coinListWeightSchema = coinListMeasurementRangeSchema(3)
export type CoinListWeight = z.infer<typeof coinListWeightSchema>
export const coinListWeightToInterval = coinListSizeToInterval
