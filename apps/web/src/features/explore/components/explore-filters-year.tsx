import { useNavigate } from "@tanstack/react-router"
import { coinListYearQuerySchema } from "@workspace/api"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { useEffect, useId, useState } from "react"
import type { CoinListYear } from "@workspace/api"

import { formatCoinListYear } from "@/features/issue-period"

type YearFilterProps = {
  engraverSlug?: string
  issuerCode?: string
  year?: CoinListYear
}

function parseYearFilterDraft(draft: string) {
  const trimmedDraft = draft.trim()
  const rangeMatch =
    /^([1-9]\d*)\s*(BCE|CE)?\s*[-–]\s*([1-9]\d*)\s*(BCE|CE)?$/i.exec(
      trimmedDraft
    )
  if (rangeMatch) {
    const [, first, rawFirstEra = "", last, rawLastEra = ""] = rangeMatch
    const lastEra = rawLastEra.toUpperCase()
    const firstEra = rawFirstEra.toUpperCase() || lastEra || "CE"
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

function formatYearFilterDraft(year: CoinListYear | undefined) {
  if (year === undefined) return ""
  return formatCoinListYear(year)
}

export function YearFilter({
  engraverSlug,
  issuerCode,
  year,
}: YearFilterProps) {
  const navigate = useNavigate({ from: "/" })
  const errorId = useId()
  const [draft, setDraft] = useState(formatYearFilterDraft(year))
  const [error, setError] = useState<string>()

  useEffect(() => {
    setDraft(formatYearFilterDraft(year))
    setError(undefined)
  }, [year])

  const apply = () => {
    const issueYear = parseYearFilterDraft(draft)
    if (issueYear === undefined) {
      setError(
        "Enter one Issue Year or an ordered range, such as 400–300 BCE, 25 BCE–19 CE, or 1986–1990."
      )
      return
    }

    setError(undefined)
    void navigate({
      to: "/",
      search: {
        engraver: engraverSlug,
        issuer: issuerCode,
        year: issueYear,
      },
    })
  }

  const clear = () => {
    setDraft("")
    setError(undefined)
    if (year === undefined) return
    void navigate({
      to: "/",
      search: {
        engraver: engraverSlug,
        issuer: issuerCode,
      },
    })
  }

  return (
    <div className="min-w-0 flex-1 md:max-w-80">
      <form
        className="flex min-w-0"
        onSubmit={(event) => {
          event.preventDefault()
          apply()
        }}
      >
        <Input
          aria-describedby={error ? errorId : undefined}
          aria-invalid={error ? true : undefined}
          aria-label="Year"
          inputMode="text"
          placeholder="Year"
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value)
            if (error) setError(undefined)
          }}
        />
        <Button type="submit" className="border-l-0">
          Apply Year
        </Button>
        <Button
          type="button"
          variant="outline"
          className="border-l-0"
          disabled={year === undefined && draft === ""}
          onClick={clear}
        >
          Clear Year
        </Button>
      </form>
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
