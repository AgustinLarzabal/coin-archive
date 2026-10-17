import { useNavigate } from "@tanstack/react-router"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { useEffect, useId, useState } from "react"
import type { CoinDistribution, CoinListYear } from "@workspace/api"

import {
  formatIssueYearFilterValue,
  parseIssueYearFilterValue,
} from "@/features/explore/filters/issue-year-filter-value"

type YearFilterProps = {
  distribution?: CoinDistribution
  engraverSlug?: string
  issuerCode?: string
  rulerSlug?: string
  year?: CoinListYear
}

export function YearFilter({
  distribution,
  engraverSlug,
  issuerCode,
  rulerSlug,
  year,
}: YearFilterProps) {
  const navigate = useNavigate({ from: "/" })
  const errorId = useId()
  const [draft, setDraft] = useState(formatIssueYearFilterValue(year))
  const [error, setError] = useState<string>()

  useEffect(() => {
    setDraft(formatIssueYearFilterValue(year))
    setError(undefined)
  }, [year])

  const apply = () => {
    const issueYear = parseIssueYearFilterValue(draft)
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
        distribution,
        engraver: engraverSlug,
        issuer: issuerCode,
        ruler: rulerSlug,
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
        distribution,
        engraver: engraverSlug,
        issuer: issuerCode,
        ruler: rulerSlug,
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
