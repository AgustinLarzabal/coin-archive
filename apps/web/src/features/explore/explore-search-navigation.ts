import { useNavigate } from "@tanstack/react-router"

import type { ExploreSearch } from "./explore-search"

export type ExploreFilterPatch = Partial<Omit<ExploreSearch, "page">>

export function updateExploreFilters(
  search: ExploreSearch,
  patch: ExploreFilterPatch
): ExploreSearch {
  return {
    ...search,
    ...patch,
    page: undefined,
  }
}

export function setExplorePage(
  search: ExploreSearch,
  page: number
): ExploreSearch {
  return {
    ...search,
    page: page === 1 ? undefined : page,
  }
}

export function useExploreSearchNavigation() {
  const navigate = useNavigate({ from: "/" })

  return {
    updateFilters: (patch: ExploreFilterPatch) => {
      void navigate({
        to: "/",
        search: (search) => updateExploreFilters(search, patch),
      })
    },
    goToPage: (page: number) => {
      void navigate({
        to: "/",
        search: (search) => setExplorePage(search, page),
      })
    },
  }
}
