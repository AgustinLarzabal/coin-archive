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
  it("keeps Issuer and page through the Archive breadcrumb", async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn((input: string | URL | Request) => {
      const url = new URL(String(input))
      if (url.pathname === "/v1/issuers") {
        return Promise.resolve(
          jsonResponse({ issuers: [{ slug: "argentina", code: "AR", name: "Argentina" }] })
        )
      }
      if (url.pathname === "/v1/compositions") {
        return Promise.resolve(jsonResponse({ compositions: [] }))
      }
      if (url.pathname === "/v1/shapes") {
        return Promise.resolve(jsonResponse({ shapes: [] }))
      }
      if (url.pathname === "/v1/orientations") {
        return Promise.resolve(jsonResponse({ orientations: [] }))
      }
      if (url.pathname === "/v1/distributions") {
        return Promise.resolve(jsonResponse({ distributions: [] }))
      }

      if (url.pathname === "/v1/techniques") {
        return Promise.resolve(jsonResponse({ techniques: [] }))
      }
      if (url.pathname === "/v1/tags") {
        return Promise.resolve(jsonResponse({ tags: [] }))
      }
      if (url.pathname === "/v1/currencies") {
        return Promise.resolve(jsonResponse({ currencies: [] }))
      }
      if (url.pathname === "/v1/mints") {
        return Promise.resolve(jsonResponse({ mints: [] }))
      }
      if (url.pathname === "/v1/engravers") {
        return Promise.resolve(jsonResponse({ engravers: [] }))
      }
      if (url.pathname === "/v1/rulers") {
        return Promise.resolve(jsonResponse({ rulers: [] }))
      }
      if (
        url.pathname.endsWith("/v1/coins/by-slug/first-coin")
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

    const router = renderArchiveRoute("/?issuer=AR&page=2")
    await user.click(await screen.findByRole("link", { name: "First coin" }))
    await screen.findByRole("heading", { name: "First coin" })
    await user.click(screen.getByRole("link", { name: "Archive" }))

    await screen.findByRole("link", { name: "First coin" })
    expect(router.state.location.pathname).toBe("/")
    expect(router.state.location.search).toMatchObject({
      issuer: "AR",
      page: 2,
    })

    await router.navigate({
      to: "/coins/$issuerSlug/$coinSlug",
      params: { issuerSlug: "argentina", coinSlug: "first-coin" },
      search: {
        issuer: "aR",
        tag: ["MaP", "map", "FLAG"],
        tagMatch: "ALL",
        page: 2,
      },
    })
    await screen.findByRole("heading", { name: "First coin" })
    expect(router.state.location.searchStr).toBe(
      "?issuer=AR&tag=map&tag=flag&tagMatch=all&page=2"
    )
    await user.click(screen.getByRole("link", { name: "Archive" }))
    await screen.findByRole("link", { name: "First coin" })
    expect(router.state.location.href).toBe(
      "/?issuer=AR&tag=map&tag=flag&tagMatch=all&page=2"
    )
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/v1/coins?issuer=AR&tag=map&tag=flag&tagMatch=all&page=2&pageSize=24"
    )
  })
})
