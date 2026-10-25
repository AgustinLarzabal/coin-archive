import { useNavigate } from "@tanstack/react-router"

import type { ExploreSearch } from "./explore-search"

export type ExploreFilterPatch = Partial<Omit<ExploreSearch, "page">>

export function updateExploreFilters(
  search: ExploreSearch,
  patch: ExploreFilterPatch
): ExploreSearch {
  const nextSearch = {
    ...search,
    ...patch,
    page: undefined,
  }
  return patch.currency === undefined && "currency" in patch
    ? { ...nextSearch, amount: undefined }
    : nextSearch
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
    updateFilters: (patch: ExploreFilterPatch, order: string[]) => {
      void navigate({
        to: "/",
        search: (search) => updateExploreFilters(search, patch),
        state: (previous) => ({ ...previous, exploreFilterOrder: order }),
      })
    },
    goToPage: (page: number) => {
      void navigate({
        to: "/",
        search: (search) => setExplorePage(search, page),
        state: true,
      })
    },
  }
}
