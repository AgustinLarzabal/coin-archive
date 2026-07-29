import { Link } from "@tanstack/react-router"
import { buttonVariants } from "@coin-archive/ui/components/button"

type EmptyStateProps = {
  hasActiveFilters: boolean
}

export function EmptyState({ hasActiveFilters }: EmptyStateProps) {
  return (
    <div className="flex w-full flex-1 items-center justify-center">
      <div className="w-full max-w-md px-4 text-center">
        <h2 className="mb-4">No coins found</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          {hasActiveFilters
            ? "Try adjusting or clearing your filters to see more results."
            : "There are no coins in the archive yet."}
        </p>

        {hasActiveFilters ? (
          <Link to="/" className={buttonVariants({ variant: "outline" })}>
            Clear filters
          </Link>
        ) : null}
      </div>
    </div>
  )
}
