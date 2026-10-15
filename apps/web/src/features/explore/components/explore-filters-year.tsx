import { useNavigate } from "@tanstack/react-router"
import { coinListYearQuerySchema } from "@workspace/api"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { useEffect, useId, useState } from "react"

type YearFilterProps = {
  engraverSlug?: string
  issuerCode?: string
  year?: number
}

export function YearFilter({
  engraverSlug,
  issuerCode,
  year,
}: YearFilterProps) {
  const navigate = useNavigate({ from: "/" })
  const errorId = useId()
  const [draft, setDraft] = useState(year === undefined ? "" : String(year))
  const [error, setError] = useState<string>()

  useEffect(() => {
    setDraft(year === undefined ? "" : String(year))
    setError(undefined)
  }, [year])

  const apply = () => {
    const result = coinListYearQuerySchema.safeParse(draft)
    if (!result.success) {
      setError("Enter one positive CE Issue Year.")
      return
    }

    setError(undefined)
    if (result.data === year) return
    void navigate({
      to: "/",
      search: {
        engraver: engraverSlug,
        issuer: issuerCode,
        year: result.data,
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
          inputMode="numeric"
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
