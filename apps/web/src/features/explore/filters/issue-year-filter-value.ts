import { coinListYearQuerySchema } from "@coin-archive/api"
import type { CoinListYear } from "@coin-archive/api"

import { formatCoinListYear } from "@/features/issue-period"

export function parseIssueYearFilterValue(draft: string) {
  const trimmedDraft = draft.trim()
  const rangeMatch =
    /^([1-9]\d*)\s*(BCE|CE)?\s*[-–]\s*([1-9]\d*)\s*(BCE|CE)?$/i.exec(
      trimmedDraft
    )
  if (rangeMatch) {
    const [, first, rawFirstEra = "", last, rawLastEra = ""] = rangeMatch
    const firstEra =
      rawFirstEra.toUpperCase() || rawLastEra.toUpperCase() || "CE"
    const lastEra =
      rawLastEra.toUpperCase() || rawFirstEra.toUpperCase() || "CE"
    const firstIssueYear = Number(first) * (firstEra === "BCE" ? -1 : 1)
    const lastIssueYear = Number(last) * (lastEra === "BCE" ? -1 : 1)
    const result = coinListYearQuerySchema.safeParse(
      `${firstIssueYear}-${lastIssueYear}`
    )
    return result.success ? result.data : undefined
  }

  const singleYearMatch = /^([1-9]\d*)\s*(BCE|CE)?$/i.exec(trimmedDraft)
  if (!singleYearMatch) return undefined

  const [, magnitude, rawEra = ""] = singleYearMatch
  const year = Number(magnitude) * (rawEra.toUpperCase() === "BCE" ? -1 : 1)
  const result = coinListYearQuerySchema.safeParse(String(year))
  return result.success ? result.data : undefined
}

export function formatIssueYearFilterValue(year: CoinListYear | undefined) {
  if (year === undefined) return ""
  return formatCoinListYear(year)
}
