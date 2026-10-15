import { useNavigate } from "@tanstack/react-router"
import { coinListYearQuerySchema } from "@workspace/api"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { useEffect, useId, useState } from "react"

import { formatIssueYear } from "@/features/issue-period"

type YearFilterProps = {
  engraverSlug?: string
  issuerCode?: string
  year?: number
}

function parseIssueYearDraft(draft: string) {
  const match = /^([1-9]\d*)\s*(BCE)?$/i.exec(draft.trim())
  if (!match) return undefined

  const year = Number(match[1]) * (match[2] ? -1 : 1)
  const result = coinListYearQuerySchema.safeParse(String(year))
  return result.success ? result.data : undefined
}

export function YearFilter({
  engraverSlug,
  issuerCode,
  year,
}: YearFilterProps) {
  const navigate = useNavigate({ from: "/" })
  const errorId = useId()
  const [draft, setDraft] = useState(
    year === undefined ? "" : formatIssueYear(year)
  )
  const [error, setError] = useState<string>()

  useEffect(() => {
    setDraft(year === undefined ? "" : formatIssueYear(year))
    setError(undefined)
  }, [year])

  const apply = () => {
    const issueYear = parseIssueYearDraft(draft)
    if (issueYear === undefined) {
      setError("Enter one CE Year or a BCE Year such as 44 BCE.")
      return
    }

    setError(undefined)
    if (issueYear === year) {
      setDraft(formatIssueYear(issueYear))
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
