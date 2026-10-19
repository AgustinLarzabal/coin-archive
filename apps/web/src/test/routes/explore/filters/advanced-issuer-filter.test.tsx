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
                    id: "test-issuer",
                    type: "rule",
                    path: ["issuer"],
                    operator: "is",
                    value: "AR",
                  },
                ]
              : [],
        })
      }}
    >
      Toggle Advanced Issuer
    </button>
  ),
}))

it("applies and clears an advanced Issuer rule through the Explore URL", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(createArchiveFetch({ issuers: [{ name: "Argentina", code: "AR" }] }))
  )
  const router = renderArchiveRoute("/")
  const toggle = await screen.findByRole("button", {
    name: "Toggle Advanced Issuer",
  })

  fireEvent.click(toggle)
  await waitFor(() =>
    expect(router.state.location.search).toEqual({
      issuer: "AR",
    })
  )
  expect(screen.getByRole("combobox", { name: "Issuer" })).toHaveValue(
    "Argentina"
  )

  fireEvent.click(toggle)
  await waitFor(() =>
    expect(router.state.location.search).toEqual({ issuer: undefined })
  )
})
