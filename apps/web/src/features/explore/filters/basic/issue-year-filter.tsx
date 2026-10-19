import { Button } from "@coin-archive/ui/components/button"
import { Input } from "@coin-archive/ui/components/input"
import { useEffect, useId, useState } from "react"
import {
  formatIssueYearFilterValue,
  parseIssueYearFilterValue,
} from "./issue-year-filter-value"
import type { CoinListYear } from "@coin-archive/api"

import { useExploreSearchNavigation } from "@/features/explore/explore-search-navigation"

type IssueYearFilterProps = {
  year?: CoinListYear
}

export function IssueYearFilter({ year }: IssueYearFilterProps) {
  const { updateFilters } = useExploreSearchNavigation()
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
    updateFilters({ year: issueYear })
  }

  const clear = () => {
    setDraft("")
    setError(undefined)
    if (year === undefined) return
    updateFilters({ year: undefined })
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
