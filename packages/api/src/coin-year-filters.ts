import { z } from "zod"

import { historicalYearSchema } from "./common.js"

const CANONICAL_ISSUE_YEAR_PATTERN = "-?[1-9]\\d*"
export const COIN_LIST_YEAR_QUERY_PATTERN = `^(?:${CANONICAL_ISSUE_YEAR_PATTERN}|${CANONICAL_ISSUE_YEAR_PATTERN}-${CANONICAL_ISSUE_YEAR_PATTERN})$`
const canonicalIssueYearPattern = new RegExp(
  `^${CANONICAL_ISSUE_YEAR_PATTERN}$`
)
const canonicalCoinListYearRangePattern = new RegExp(
  `^(${CANONICAL_ISSUE_YEAR_PATTERN})-(${CANONICAL_ISSUE_YEAR_PATTERN})$`
)

function parseCanonicalCoinListYearRange(range: string) {
  const match = canonicalCoinListYearRangePattern.exec(range)
  if (!match) return undefined

  return {
    firstIssueYear: Number(match[1]),
    lastIssueYear: Number(match[2]),
  }
}

const canonicalCoinListYearRangeSchema = z.string().refine((range) => {
  const interval = parseCanonicalCoinListYearRange(range)
  return (
    interval !== undefined &&
    Number.isSafeInteger(interval.firstIssueYear) &&
    Number.isSafeInteger(interval.lastIssueYear) &&
    interval.firstIssueYear <= interval.lastIssueYear
  )
})
export const coinListYearSchema = z.union([
  historicalYearSchema,
  canonicalCoinListYearRangeSchema,
])
export type CoinListYear = z.infer<typeof coinListYearSchema>
export const coinListYearQuerySchema = z
  .string()
  .transform((year) =>
    canonicalIssueYearPattern.test(year) ? Number(year) : year
  )
  .pipe(coinListYearSchema)
export function coinListYearToInterval(year: CoinListYear) {
  if (typeof year === "number") {
    return { firstIssueYear: year, lastIssueYear: year }
  }

  const interval = parseCanonicalCoinListYearRange(year)
  if (!interval) throw new RangeError("Issue Year range is invalid")
  return interval
}
