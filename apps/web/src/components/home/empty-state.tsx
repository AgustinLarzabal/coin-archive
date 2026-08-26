import { Link } from "@tanstack/react-router"
import { buttonVariants } from "@coin-archive/ui/components/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@coin-archive/ui/components/empty"
import { Icons } from "../icons"

type EmptyStateProps = {
  hasActiveFilters: boolean
}

export function EmptyState({ hasActiveFilters }: EmptyStateProps) {
  return (
    <div className="flex w-full flex-1 items-center justify-center">
      <Empty className="min-h-[400px] w-full max-w-4xl border border-dashed">
        <EmptyHeader>
          <EmptyMedia>
            <Icons.LogoSmall />
          </EmptyMedia>
          <EmptyTitle>No coins found</EmptyTitle>
          <EmptyDescription>
            {hasActiveFilters
              ? "Try adjusting or clearing your filters to see more results."
              : "There are no coins in the archive yet."}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          {hasActiveFilters ? (
            <Link to="/" className={buttonVariants({ variant: "outline" })}>
              Clear filters
            </Link>
          ) : null}
        </EmptyContent>
      </Empty>
    </div>
  )
}
