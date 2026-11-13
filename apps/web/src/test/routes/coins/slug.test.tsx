import { createMemoryHistory, RouterProvider } from "@tanstack/react-router"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { getRouter } from "@/router"
import { jsonResponse } from "@/test/archive-route-test"
import { coinDetailFixture } from "@/test/coin-fixtures"

function renderSlugRoute(path: string) {
  const router = getRouter({
    history: createMemoryHistory({ initialEntries: [path] }),
  })
  render(<RouterProvider router={router} />)
  return router
}

describe("Coin Slug route", () => {
  it("does not serve the former UUID detail URL", async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)
    renderSlugRoute("/coins/00000000-0000-4000-8000-000000000001")
    expect(await screen.findByText("404 - Page not found")).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })
  it.each([
    ["hamburg-2008", 2008],
    ["hamburg-2023", 2023],
  ])(
    "opens %s at the matching detail and retains Explore search",
    async (slug, year) => {
      vi.stubGlobal(
        "fetch",
        vi.fn(() =>
          Promise.resolve(
            jsonResponse(
              coinDetailFixture({
                title: "Hamburg",
                slug,
                firstIssueYear: year,
                lastIssueYear: year,
                issuer: { name: "Germany", code: "DE", slug: "germany" },
              })
            )
          )
        )
      )
      const router = renderSlugRoute(`/coins/germany/${slug}?page=2`)
      expect(
        await screen.findByRole("heading", { name: "Hamburg" })
      ).toBeInTheDocument()
      expect(screen.getByText(String(year))).toBeInTheDocument()
      expect(router.state.location.search).toMatchObject({ page: 2 })
      expect(screen.getByRole("link", { name: "Archive" })).toHaveAttribute(
        "href",
        "/?page=2"
      )
    }
  )

  it("shows not found when the Issuer Slug is wrong", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          jsonResponse(
            coinDetailFixture({
              slug: "hamburg-2008",
              issuer: { name: "Germany", code: "DE", slug: "germany" },
            })
          )
        )
      )
    )
    renderSlugRoute("/coins/france/hamburg-2008")
    expect(await screen.findByText("Coin not found")).toBeInTheDocument()
    expect(
      screen.queryByRole("heading", { name: "First coin" })
    ).not.toBeInTheDocument()
  })

  it("shows not found for an unknown Coin Slug", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          jsonResponse(
            { error: { code: "coin_not_found", message: "Coin not found" } },
            404
          )
        )
      )
    )
    renderSlugRoute("/coins/germany/unknown-coin")
    expect(await screen.findByText("Coin not found")).toBeInTheDocument()
  })
})
