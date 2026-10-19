import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import {
  coinListJsonResponse,
  jsonResponse,
  renderArchiveRoute,
} from "@/test/archive-route-test"
import { coinDetailFixture, coinListItemFixture } from "@/test/coin-fixtures"

describe("returning from a coin to Explore", () => {
  it("keeps the selected filters and page through the Archive breadcrumb", async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn((input: string | URL | Request) => {
      const url = new URL(String(input))
      if (url.pathname === "/v1/issuers") {
        return Promise.resolve(
          jsonResponse({ issuers: [{ code: "AR", name: "Argentina" }] })
        )
      }
      if (url.pathname === "/v1/currencies") {
        return Promise.resolve(jsonResponse({ currencies: [] }))
      }
      if (url.pathname === "/v1/engravers") {
        return Promise.resolve(jsonResponse({ engravers: [] }))
      }
      if (url.pathname === "/v1/rulers") {
        return Promise.resolve(jsonResponse({ rulers: [] }))
      }
      if (
        url.pathname.endsWith("/v1/coins/00000000-0000-4000-8000-000000000001")
      ) {
        return Promise.resolve(jsonResponse(coinDetailFixture()))
      }
      return Promise.resolve(
        coinListJsonResponse([coinListItemFixture()], {
          page: 2,
          pageSize: 24,
          totalItems: 48,
          totalPages: 2,
        })
      )
    })
    vi.stubGlobal("fetch", fetchMock)

    const router = renderArchiveRoute("/?issuer=AR&year=2004&page=2")
    await user.click(await screen.findByRole("link", { name: "First coin" }))
    await screen.findByRole("heading", { name: "First coin" })
    await user.click(screen.getByRole("link", { name: "Archive" }))

    await screen.findByRole("link", { name: "First coin" })
    expect(router.state.location.pathname).toBe("/")
    expect(router.state.location.search).toMatchObject({
      issuer: "AR",
      year: 2004,
      page: 2,
    })
  })
})
