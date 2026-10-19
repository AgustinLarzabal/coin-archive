import { fireEvent, screen, waitFor } from "@testing-library/react"
import { expect, it, vi } from "vitest"
import type { FilterQuery } from "@coin-archive/ui/components/reui/filters/filters-types"

import {
  createArchiveFetch,
  renderArchiveRoute,
} from "@/test/archive-route-test"

vi.mock("@coin-archive/ui/components/reui/filters/filters", () => ({
  Filters: ({
    onQueryChange,
    query,
  }: {
    onQueryChange: (query: FilterQuery<string>) => void
    query: FilterQuery<string>
  }) => (
    <button
      type="button"
      onClick={() => {
        onQueryChange({
          id: "root",
          type: "group",
          combinator: "and",
          rules:
            query.rules.length === 0
              ? [
                  {
                    id: "test-distribution",
                    type: "rule",
                    path: ["distribution"],
                    operator: "is",
                    value: "non-circulating",
                  },
                ]
              : [],
        })
      }}
    >
      Toggle ReUI Distribution
    </button>
  ),
}))

it("applies and clears a ReUI Coin Distribution rule through the Explore URL", async () => {
  vi.stubGlobal("fetch", vi.fn(createArchiveFetch()))
  const router = renderArchiveRoute("/")
  const toggle = await screen.findByRole("button", {
    name: "Toggle ReUI Distribution",
  })

  fireEvent.click(toggle)
  await waitFor(() =>
    expect(router.state.location.search).toEqual({
      distribution: "non-circulating",
    })
  )
  expect(screen.getByRole("combobox", { name: "Distribution" })).toHaveValue(
    "Non-circulating"
  )

  fireEvent.click(toggle)
  await waitFor(() =>
    expect(router.state.location.search).toEqual({ distribution: undefined })
  )
})
