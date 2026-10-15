import { useNavigate } from "@tanstack/react-router"
import { coinListYearQuerySchema } from "@workspace/api"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { useEffect, useId, useState } from "react"
import type { CoinListYear } from "@workspace/api"

import { formatIssueYear } from "@/features/issue-period"

type YearFilterProps = {
  engraverSlug?: string
  issuerCode?: string
  year?: CoinListYear
}

function parseIssueYearDraft(draft: string) {
  const trimmedDraft = draft.trim()
  const rangeMatch = /^([1-9]\d*)\s*[-–]\s*([1-9]\d*)$/.exec(trimmedDraft)
  if (rangeMatch) {
    const result = coinListYearQuerySchema.safeParse(
      `${rangeMatch[1]}-${rangeMatch[2]}`
    )
    return result.success ? result.data : undefined
  }

  const singleYearMatch = /^([1-9]\d*)\s*(BCE)?$/i.exec(trimmedDraft)
  if (!singleYearMatch) return undefined

  const year = Number(singleYearMatch[1]) * (singleYearMatch[2] ? -1 : 1)
  const result = coinListYearQuerySchema.safeParse(String(year))
  return result.success ? result.data : undefined
}

function formatIssueYearDraft(year: CoinListYear | undefined) {
  if (year === undefined) return ""
  return typeof year === "number" ? formatIssueYear(year) : year
}

export function YearFilter({
  engraverSlug,
  issuerCode,
  year,
}: YearFilterProps) {
  const navigate = useNavigate({ from: "/" })
  const errorId = useId()
  const [draft, setDraft] = useState(formatIssueYearDraft(year))
  const [error, setError] = useState<string>()

  useEffect(() => {
    setDraft(formatIssueYearDraft(year))
    setError(undefined)
  }, [year])

  const apply = () => {
    const issueYear = parseIssueYearDraft(draft)
    if (issueYear === undefined) {
      setError(
        "Enter one Issue Year or an ordered CE range, such as 1986-1990."
      )
      return
    }

    setError(undefined)
    if (issueYear === year) {
      setDraft(formatIssueYearDraft(issueYear))
      return
    }
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
