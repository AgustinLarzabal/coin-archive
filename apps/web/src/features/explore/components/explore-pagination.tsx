import { useNavigate } from "@tanstack/react-router"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldGroup, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@workspace/ui/components/pagination"
import type { CoinListFilters } from "@/data/archive"
import type { CoinListPaginationResponse } from "@workspace/api"
import type { FormEvent } from "react"

const PAGE_WINDOW_SIZE = 5

export function ExplorePagination({
  filters,
  pagination,
}: {
  filters: CoinListFilters
  pagination: CoinListPaginationResponse
}) {
  const navigate = useNavigate({ from: "/" })
  const { page, totalPages } = pagination
  const nearbyPages = getNearbyPages(page, totalPages)
  const goToPage = (nextPage: number) => {
    void navigate({
      to: "/",
      search: {
        engraver: filters.engraverSlug,
        issuer: filters.issuerCode,
        page: nextPage === 1 ? undefined : nextPage,
      },
    })
  }
  const handleDirectPageSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const nextPage = Number(form.get("page"))

    if (!Number.isInteger(nextPage) || nextPage < 1 || nextPage > totalPages) {
      return
    }

    goToPage(nextPage)
  }

  return (
    <Pagination
      aria-label="Pagination"
      className="flex-col gap-4 border-t py-5"
    >
      <PaginationContent>
        <PaginationItem>
          <Button
            type="button"
            variant="ghost"
            disabled={page === 1}
            aria-label="Go to first page"
            onClick={() => goToPage(1)}
          >
            First
          </Button>
        </PaginationItem>
        <PaginationItem>
          <Button
            type="button"
            variant="ghost"
            disabled={page === 1}
            aria-label="Go to previous page"
            onClick={() => goToPage(page - 1)}
          >
            Previous
          </Button>
        </PaginationItem>
        {nearbyPages.map((nearbyPage) => {
          const isCurrent = nearbyPage === page

          return (
            <PaginationItem key={nearbyPage}>
              <Button
                type="button"
                size="icon"
                variant={isCurrent ? "outline" : "ghost"}
                aria-current={isCurrent ? "page" : undefined}
                aria-label={
                  isCurrent ? `Page ${nearbyPage}` : `Go to page ${nearbyPage}`
                }
                onClick={() => goToPage(nearbyPage)}
              >
                {nearbyPage}
              </Button>
            </PaginationItem>
          )
        })}
        <PaginationItem>
          <Button
            type="button"
            variant="ghost"
            disabled={page === totalPages}
            aria-label="Go to next page"
            onClick={() => goToPage(page + 1)}
          >
            Next
          </Button>
        </PaginationItem>
        <PaginationItem>
          <Button
            type="button"
            variant="ghost"
            disabled={page === totalPages}
            aria-label="Go to last page"
            onClick={() => goToPage(totalPages)}
          >
            Last
          </Button>
        </PaginationItem>
      </PaginationContent>
      <form onSubmit={handleDirectPageSubmit}>
        <FieldGroup>
          <Field orientation="horizontal" className="w-auto">
            <FieldLabel htmlFor="explore-page-number">Page number</FieldLabel>
            <Input
              key={page}
              id="explore-page-number"
              name="page"
              type="number"
              inputMode="numeric"
              min={1}
              max={totalPages}
              defaultValue={page}
              required
              className="w-20"
            />
            <Button type="submit" variant="outline">
              Go
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </Pagination>
  )
}

function getNearbyPages(page: number, totalPages: number) {
  const size = Math.min(PAGE_WINDOW_SIZE, totalPages)
  const start = Math.min(
    Math.max(page - Math.floor(size / 2), 1),
    totalPages - size + 1
  )

  return Array.from({ length: size }, (_, index) => start + index)
}
