import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import type { CoinListItemResponse } from "@workspace/api"

import {
  coinListJsonResponse,
  createArchiveFetch,
  jsonResponse,
  renderArchiveRoute,
} from "@/test/archive-route-test"

const coin: CoinListItemResponse = {
  id: "00000000-0000-4000-8000-000000000001",
  title: "First coin",
  distribution: "circulating-commemorative",
  firstIssueYear: 2004,
  lastIssueYear: 2004,
  issuer: { name: "Argentina", code: "AR" },
  createdAt: "2026-09-16T10:00:00.000Z",
  updatedAt: "2026-09-16T11:00:00.000Z",
  obverseImageUrl: null,
  reverseImageUrl: null,
}

const issuers = [{ name: "Argentina", code: "AR" }]
const engravers = [{ slug: "first-engraver", fullName: "First Engraver" }]

function createPageAwareArchiveFetch(totalPages = 3) {
  return (input: string | URL | Request) => {
    const url = String(input)
    if (url.endsWith("/v1/issuers")) {
      return Promise.resolve(jsonResponse({ issuers }))
    }
    if (url.endsWith("/v1/engravers")) {
      return Promise.resolve(jsonResponse({ engravers }))
    }
    if (url.endsWith("/v1/rulers")) {
      return Promise.resolve(jsonResponse({ rulers: [] }))
    }

    const page = Number(new URL(url).searchParams.get("page"))
    return Promise.resolve(
      coinListJsonResponse([{ ...coin, title: `Coin on page ${page}` }], {
        page,
        pageSize: 24,
        totalItems: totalPages * 24,
        totalPages,
      })
    )
  }
}

describe("Explore pagination", () => {
  it("renders accessible boundary and nearby-page controls", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        createArchiveFetch({
          coins: [coin],
          engravers,
          issuers,
          pagination: {
            page: 1,
            pageSize: 24,
            totalItems: 288,
            totalPages: 12,
          },
        })
      )
    )

    renderArchiveRoute()

    await screen.findByRole("link", { name: "First coin" })
    const pagination = screen.getByRole("navigation", { name: "Pagination" })

    expect(
      within(pagination).getByRole("button", { name: "Go to first page" })
    ).toBeDisabled()
    expect(
      within(pagination).getByRole("button", { name: "Go to previous page" })
    ).toBeDisabled()
    expect(
      within(pagination).getByRole("button", { name: "Page 1" })
    ).toHaveAttribute("aria-current", "page")
    for (const page of [2, 3, 4, 5]) {
      expect(
        within(pagination).getByRole("button", {
          name: `Go to page ${page}`,
        })
      ).toBeEnabled()
    }
    expect(
      within(pagination).getByRole("button", { name: "Go to next page" })
    ).toBeEnabled()
    expect(
      within(pagination).getByRole("button", { name: "Go to last page" })
    ).toBeEnabled()
    expect(
      within(pagination).queryByRole("button", { name: "Go to page 6" })
    ).not.toBeInTheDocument()
  })

  it("operates every sequential and boundary control from the keyboard", async () => {
    vi.stubGlobal("fetch", vi.fn(createPageAwareArchiveFetch()))
    const router = renderArchiveRoute("/?page=2")
    const user = userEvent.setup()

    await screen.findByRole("link", { name: "Coin on page 2" })
    screen.getByRole("button", { name: "Go to previous page" }).focus()
    await user.keyboard("{Enter}")
    await screen.findByRole("link", { name: "Coin on page 1" })
    expect(router.state.location.searchStr).toBe("")

    screen.getByRole("button", { name: "Go to next page" }).focus()
    await user.keyboard("{Enter}")
    await screen.findByRole("link", { name: "Coin on page 2" })

    screen.getByRole("button", { name: "Go to last page" }).focus()
    await user.keyboard("{Enter}")
    await screen.findByRole("link", { name: "Coin on page 3" })
    expect(
      screen.getByRole("button", { name: "Go to next page" })
    ).toBeDisabled()
    expect(
      screen.getByRole("button", { name: "Go to last page" })
    ).toBeDisabled()
    expect(
      screen.getByRole("button", { name: "Go to first page" })
    ).toBeEnabled()

    screen.getByRole("button", { name: "Go to first page" }).focus()
    await user.keyboard("{Enter}")
    await screen.findByRole("link", { name: "Coin on page 1" })
    expect(router.state.location.searchStr).toBe("")
  })

  it("canonicalizes an explicit first page without losing filters", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        createArchiveFetch({
          coins: [coin],
          engravers,
          issuers,
          pagination: {
            page: 1,
            pageSize: 24,
            totalItems: 1,
            totalPages: 1,
          },
        })
      )
    )
    const router = renderArchiveRoute("/?issuer=AR&page=1")

    expect(
      await screen.findByRole("link", { name: "First coin" })
    ).toBeVisible()
    expect(router.state.location.searchStr).toBe("?issuer=AR")
  })

  it("replace-navigates a stale page to the last page while preserving filters", async () => {
    const fetchMock = vi.fn((input: string | URL | Request) => {
      const url = String(input)

      if (url.endsWith("/v1/issuers")) {
        return Promise.resolve(jsonResponse({ issuers }))
      }
      if (url.endsWith("/v1/engravers")) {
        return Promise.resolve(jsonResponse({ engravers }))
      }
      if (url.endsWith("/v1/rulers")) {
        return Promise.resolve(jsonResponse({ rulers: [] }))
      }

      const page = Number(new URL(url).searchParams.get("page"))
      if (page === 9) {
        return Promise.resolve(
          coinListJsonResponse([], {
            page: 9,
            pageSize: 24,
            totalItems: 49,
            totalPages: 3,
          })
        )
      }

      return Promise.resolve(
        coinListJsonResponse(
          [{ ...coin, title: page === 3 ? "Last-page coin" : "First coin" }],
          {
            page,
            pageSize: 24,
            totalItems: 49,
            totalPages: 3,
          }
        )
      )
    })
    vi.stubGlobal("fetch", fetchMock)
    const router = renderArchiveRoute()

    await screen.findByRole("link", { name: "First coin" })
    await router.navigate({
      to: "/",
      search: { issuer: "AR", year: "-25-19", page: 9 },
    })

    expect(
      await screen.findByRole("link", { name: "Last-page coin" })
    ).toBeVisible()
    expect(router.state.location.search).toEqual({
      issuer: "AR",
      year: "-25-19",
      page: 3,
    })
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/v1/coins?issuer=AR&year=-25-19&page=9&pageSize=24"
    )
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/v1/coins?issuer=AR&year=-25-19&page=3&pageSize=24"
    )

    router.history.back()
    await waitFor(() => expect(router.state.location.searchStr).toBe(""))
    expect(screen.getByRole("link", { name: "First coin" })).toBeVisible()
  })

  it("restores a filtered page URL and Coins with browser Back and Forward", async () => {
    vi.stubGlobal("fetch", vi.fn(createPageAwareArchiveFetch()))
    const router = renderArchiveRoute("/?ruler=selected-authority", [
      { slug: "selected-authority", name: "Selected Authority" },
    ])
    const user = userEvent.setup()

    await screen.findByRole("link", { name: "Coin on page 1" })
    await user.click(screen.getByRole("button", { name: "Go to page 2" }))
    expect(
      await screen.findByRole("link", { name: "Coin on page 2" })
    ).toBeVisible()
    expect(router.state.location.searchStr).toBe(
      "?ruler=selected-authority&page=2"
    )

    router.history.back()
    expect(
      await screen.findByRole("link", { name: "Coin on page 1" })
    ).toBeVisible()
    expect(router.state.location.searchStr).toBe("?ruler=selected-authority")

    router.history.forward()
    expect(
      await screen.findByRole("link", { name: "Coin on page 2" })
    ).toBeVisible()
    expect(router.state.location.searchStr).toBe(
      "?ruler=selected-authority&page=2"
    )
  })

  it("normalizes zero matches to page 1 without pagination controls", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        createArchiveFetch({
          coins: [],
          engravers,
          issuers,
          pagination: {
            page: 8,
            pageSize: 24,
            totalItems: 0,
            totalPages: 0,
          },
        })
      )
    )
    const router = renderArchiveRoute("/?issuer=AR&page=8")

    expect(
      await screen.findByText("No coins match the selected filters.")
    ).toBeVisible()
    expect(router.state.location.searchStr).toBe("?issuer=AR")
    expect(
      screen.queryByRole("navigation", { name: "Pagination" })
    ).not.toBeInTheDocument()
  })

  it("resets page navigation when the Issuer filter changes", async () => {
    const fetchMock = vi.fn(createPageAwareArchiveFetch())
    vi.stubGlobal("fetch", fetchMock)
    const router = renderArchiveRoute(
      "/?issuer=AR&engraver=first-engraver&year=1986&page=3"
    )

    await screen.findByRole("link", { name: "Coin on page 3" })
    const issuerCombobox = screen.getByRole("combobox", { name: "Issuer" })
    const issuerControl = issuerCombobox.parentElement
    if (!issuerControl) throw new Error("Issuer combobox control not found")
    const user = userEvent.setup()
    await user.click(
      within(issuerControl).getByRole("button", { name: "Clear" })
    )

    await waitFor(() =>
      expect(router.state.location.search).toEqual({
        engraver: "first-engraver",
        year: 1986,
      })
    )
    await screen.findByRole("link", { name: "Coin on page 1" })
    await waitFor(() => expect(router.state.status).toBe("idle"))
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/v1/coins?engraver=first-engraver&year=1986&page=1&pageSize=24"
    )
  })

  it("resets page navigation when the Engraver filter changes", async () => {
    const fetchMock = vi.fn(createPageAwareArchiveFetch())
    vi.stubGlobal("fetch", fetchMock)
    const router = renderArchiveRoute(
      "/?issuer=AR&engraver=first-engraver&year=1986&page=3"
    )

    await screen.findByRole("link", { name: "Coin on page 3" })
    const engraverCombobox = screen.getByRole("combobox", {
      name: "Engraver",
    })
    const engraverControl = engraverCombobox.parentElement
    if (!engraverControl) throw new Error("Engraver combobox control not found")
    const user = userEvent.setup()
    await user.click(
      within(engraverControl).getByRole("button", { name: "Clear" })
    )

    await waitFor(() =>
      expect(router.state.location.search).toEqual({ issuer: "AR", year: 1986 })
    )
    await screen.findByRole("link", { name: "Coin on page 1" })
    await waitFor(() => expect(router.state.status).toBe("idle"))
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/v1/coins?issuer=AR&year=1986&page=1&pageSize=24"
    )
  })
})
