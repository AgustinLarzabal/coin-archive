import { faceValueAmountQuerySchema } from "@coin-archive/api"
import { Button } from "@coin-archive/ui/components/button"
import { Input } from "@coin-archive/ui/components/input"
import { useEffect, useId, useState } from "react"

import { useExploreSearchNavigation } from "@/features/explore/explore-search-navigation"

export function AmountFilter({
  amount,
  currencySelected,
}: {
  amount?: string
  currencySelected: boolean
}) {
  const { updateFilters } = useExploreSearchNavigation()
  const errorId = useId()
  const [draft, setDraft] = useState(amount ?? "")
  const [error, setError] = useState<string>()

  useEffect(() => {
    setDraft(amount ?? "")
    setError(undefined)
  }, [amount, currencySelected])

  const apply = () => {
    const result = faceValueAmountQuerySchema.safeParse(draft)
    if (!result.success) {
      setError("Enter a positive decimal with up to 12 fractional digits.")
      return
    }
    setError(undefined)
    updateFilters({ amount: result.data })
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
          aria-label="Amount"
          disabled={!currencySelected}
          inputMode="decimal"
          placeholder="Amount"
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value)
            if (error) setError(undefined)
          }}
        />
        <Button
          type="submit"
          className="border-l-0"
          disabled={!currencySelected}
        >
          Apply Amount
        </Button>
        <Button
          type="button"
          variant="outline"
          className="border-l-0"
          disabled={!currencySelected || (amount === undefined && draft === "")}
          onClick={() => {
            setDraft("")
            setError(undefined)
            if (amount !== undefined) updateFilters({ amount: undefined })
          }}
        >
          Clear Amount
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
