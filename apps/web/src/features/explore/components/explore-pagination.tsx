import { useNavigate } from "@tanstack/react-router"
import {
  Pagination,
  PaginationContent,
  PaginationFirst,
  PaginationItem,
  PaginationLast,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@workspace/ui/components/pagination"
import type { CoinListFilters } from "@/data/archive"
import type { CoinListPaginationResponse } from "@workspace/api"

const MAX_VISIBLE_PAGE_LINKS = 5

export function ExplorePagination({
  filters,
  pagination,
}: {
  filters: CoinListFilters
  pagination: CoinListPaginationResponse
}) {
  const navigate = useNavigate({ from: "/" })
  const { page, totalPages } = pagination
  const isFirstPage = page === 1
  const isLastPage = page === totalPages
  const nearbyPages = getNearbyPages(page, totalPages)
  const goToPage = (nextPage: number) => {
    void navigate({
      to: "/",
      search: {
        engraver: filters.engraverSlug,
        issuer: filters.issuerCode,
        year: filters.issueYear,
        page: nextPage === 1 ? undefined : nextPage,
      },
    })
  }
  return (
    <Pagination className="my-10 gap-6">
      <PaginationContent>
        <PaginationItem>
          <PaginationFirst disabled={isFirstPage} onClick={() => goToPage(1)} />
        </PaginationItem>
        <PaginationItem>
          <PaginationPrevious
            disabled={isFirstPage}
            onClick={() => goToPage(page - 1)}
          />
        </PaginationItem>

        {nearbyPages.map((nearbyPage) => {
          const isCurrent = nearbyPage === page
          return (
            <PaginationItem key={nearbyPage}>
              <PaginationLink
                isActive={isCurrent}
                aria-label={
                  isCurrent ? `Page ${nearbyPage}` : `Go to page ${nearbyPage}`
                }
                onClick={() => goToPage(nearbyPage)}
              >
                {nearbyPage}
              </PaginationLink>
            </PaginationItem>
          )
        })}

        <PaginationItem>
          <PaginationNext
            disabled={isLastPage}
            onClick={() => goToPage(page + 1)}
          />
        </PaginationItem>
        <PaginationItem>
          <PaginationLast
            disabled={isLastPage}
            onClick={() => goToPage(totalPages)}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

function getNearbyPages(page: number, totalPages: number) {
  const size = Math.min(MAX_VISIBLE_PAGE_LINKS, totalPages)
  const start = Math.min(
    Math.max(page - Math.floor(size / 2), 1),
    totalPages - size + 1
  )

  return Array.from({ length: size }, (_, index) => start + index)
}
