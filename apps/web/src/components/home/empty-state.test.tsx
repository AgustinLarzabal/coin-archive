import type { ComponentPropsWithoutRef } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { EmptyState } from "./empty-state"

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    ...props
  }: ComponentPropsWithoutRef<"a">) => (
    <a {...props}>{children}</a>
  ),
}))

describe("EmptyState", () => {
  it("renders the filter recovery action when no filtered coins are found", () => {
    const markup = renderToStaticMarkup(<EmptyState hasActiveFilters />)

    expect(markup).toContain("No coins found")
    expect(markup).toContain(
      "Try adjusting or clearing your filters to see more results."
    )
    expect(markup).toContain("Clear filters")
  })

  it("renders archive copy without a recovery action when there are no filters", () => {
    const markup = renderToStaticMarkup(
      <EmptyState hasActiveFilters={false} />
    )

    expect(markup).toContain("There are no coins in the archive yet.")
    expect(markup).not.toContain("Clear filters")
  })
})
