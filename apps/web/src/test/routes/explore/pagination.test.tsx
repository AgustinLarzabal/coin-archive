import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import {
  coinListJsonResponse,
  createArchiveFetch,
  jsonResponse,
  renderArchiveRoute,
} from "@/test/archive-route-test"
import { coinListItemFixture } from "@/test/coin-fixtures"

const coin = coinListItemFixture()

const issuers = [{ name: "Argentina", code: "AR" }]

function createPageAwareArchiveFetch(totalPages = 3) {
  return (input: string | URL | Request) => {
    const url = String(input)
    if (url.endsWith("/v1/issuers")) {
      return Promise.resolve(jsonResponse({ issuers }))
    }
    if (url.endsWith("/v1/compositions")) {
      return Promise.resolve(jsonResponse({ compositions: [] }))
    }
    if (url.endsWith("/v1/shapes")) {
      return Promise.resolve(jsonResponse({ shapes: [] }))
    }
    if (url.endsWith("/v1/orientations")) {
      return Promise.resolve(
        jsonResponse({ orientations: [{ slug: "coin", name: "Coin" }] })
      )
    }
    if (url.endsWith("/v1/tags")) {
      return Promise.resolve(jsonResponse({ tags: [] }))
    }
    if (url.endsWith("/v1/distributions")) {
      return Promise.resolve(jsonResponse({ distributions: [] }))
    }

    if (url.endsWith("/v1/techniques")) {
      return Promise.resolve(jsonResponse({ techniques: [] }))
    }
    if (url.endsWith("/v1/currencies")) {
      return Promise.resolve(jsonResponse({ currencies: [] }))
    }
    if (url.endsWith("/v1/mints")) {
      return Promise.resolve(jsonResponse({ mints: [] }))
    }
    if (url.endsWith("/v1/engravers")) {
      return Promise.resolve(jsonResponse({ engravers: [] }))
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
  it("keeps any Tag mode through paging and browser back", async () => {
    const fetchMock = vi.fn(createPageAwareArchiveFetch())
    vi.stubGlobal("fetch", fetchMock)
    const router = renderArchiveRoute("/?tag=map&tag=flag&tagMatch=any")
    const user = userEvent.setup()

    await screen.findByRole("link", { name: "Coin on page 1" })
    await user.click(screen.getByRole("button", { name: "Go to next page" }))
    await waitFor(() =>
      expect(router.state.location.search).toMatchObject({
        tag: ["map", "flag"],
        tagMatch: "any",
        page: 2,
      })
    )
    expect(router.state.location.href).toBe(
      "/?tag=map&tag=flag&tagMatch=any&page=2"
    )
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/v1/coins?tag=map&tag=flag&tagMatch=any&page=2&pageSize=24"
    )
    router.history.back()
    await waitFor(() =>
      expect(router.state.location.search).toMatchObject({
        tag: ["map", "flag"],
        tagMatch: "any",
      })
    )
    expect(router.state.location.search.page).toBeUndefined()
  })

  it("keeps all selected Tags when redirecting an out-of-range page", async () => {
    const fetchMock = vi.fn(createPageAwareArchiveFetch())
    vi.stubGlobal("fetch", fetchMock)
    const router = renderArchiveRoute("/?tag=map&tag=flag&tagMatch=any&page=5")

    await waitFor(() =>
      expect(router.state.location.search).toMatchObject({
        tag: ["map", "flag"],
        tagMatch: "any",
        page: 3,
      })
    )
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/v1/coins?tag=map&tag=flag&tagMatch=any&page=3&pageSize=24"
    )
  })
  it("keeps explicit all mode when redirecting an out-of-range page", async () => {
    const fetchMock = vi.fn(createPageAwareArchiveFetch())
    vi.stubGlobal("fetch", fetchMock)
    const router = renderArchiveRoute("/?tag=map&tag=flag&tagMatch=all&page=5")

    await waitFor(() =>
      expect(router.state.location.search).toMatchObject({
        tag: ["map", "flag"],
        tagMatch: "all",
        page: 3,
      })
    )
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/v1/coins?tag=map&tag=flag&tagMatch=all&page=3&pageSize=24"
    )
  })
  it("keeps Coin Orientation when changing pages", async () => {
    const fetchMock = vi.fn(createPageAwareArchiveFetch())
    vi.stubGlobal("fetch", fetchMock)
    const router = renderArchiveRoute("/?orientation=coin")
    const user = userEvent.setup()

    await screen.findByRole("link", { name: "Coin on page 1" })
    await user.click(screen.getByRole("button", { name: "Go to next page" }))
    await waitFor(() =>
      expect(router.state.location.search).toMatchObject({
        orientation: "coin",
        page: 2,
      })
    )
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/v1/coins?orientation=coin&page=2&pageSize=24"
    )
  })
  it("keeps Technique and Issuer when changing pages", async () => {
    const fetchMock = vi.fn(createPageAwareArchiveFetch())
    vi.stubGlobal("fetch", fetchMock)
    const router = renderArchiveRoute("/?technique=milled&issuer=AR")
    const user = userEvent.setup()

    await screen.findByRole("link", { name: "Coin on page 1" })
    await user.click(screen.getByRole("button", { name: "Go to next page" }))

    await waitFor(() =>
      expect(router.state.location.search).toMatchObject({
        technique: "milled",
        issuer: "AR",
        page: 2,
      })
    )
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/v1/coins?issuer=AR&technique=milled&page=2&pageSize=24"
    )
  })
  it("keeps Shape and Issuer when changing pages", async () => {
    const fetchMock = vi.fn(createPageAwareArchiveFetch())
    vi.stubGlobal("fetch", fetchMock)
    const router = renderArchiveRoute("/?shape=square&issuer=AR")
    const user = userEvent.setup()

    await screen.findByRole("link", { name: "Coin on page 1" })
    await user.click(screen.getByRole("button", { name: "Go to next page" }))

    await waitFor(() =>
      expect(router.state.location.searchStr).toBe(
        "?issuer=AR&shape=square&page=2"
      )
    )
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/v1/coins?issuer=AR&shape=square&page=2&pageSize=24"
    )
  })

  it("renders accessible boundary and nearby-page controls", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        createArchiveFetch({
          coins: [coin],
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
          currencies: [
            {
              slug: "argentine-peso",
              name: "Peso",
              fullName: "Argentine peso",
            },
          ],
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
    const router = renderArchiveRoute(
      "/?currency=argentine-peso&distribution=standard-circulation&issuer=AR&page=1"
    )

    expect(
      await screen.findByRole("link", { name: "First coin" })
    ).toBeVisible()
    expect(router.state.location.searchStr).toBe(
      "?currency=argentine-peso&distribution=standard-circulation&issuer=AR"
    )
  })

  it("canonicalizes an explicit first page with Mint", async () => {
    vi.stubGlobal("fetch", vi.fn(createArchiveFetch({ coins: [] })))
    const router = renderArchiveRoute("/?mint=unknown-mint&page=1")

    expect(await screen.findByText("Mint not found")).toBeVisible()
    expect(router.state.location.searchStr).toBe("?mint=unknown-mint")
  })

  it("canonicalizes an explicit first page with Engraver", async () => {
    vi.stubGlobal("fetch", vi.fn(createArchiveFetch({ coins: [] })))
    const router = renderArchiveRoute("/?engraver=unknown-engraver&page=1")

    expect(await screen.findByText("Engraver not found")).toBeVisible()
    expect(router.state.location.searchStr).toBe("?engraver=unknown-engraver")
  })

  it("canonicalizes an explicit first page with Ruling Authority", async () => {
    vi.stubGlobal("fetch", vi.fn(createArchiveFetch({ coins: [] })))
    const router = renderArchiveRoute("/?ruler=unknown-ruler&page=1")

    expect(await screen.findByText("Ruler / Period not found")).toBeVisible()
    expect(router.state.location.searchStr).toBe("?ruler=unknown-ruler")
  })

  it("replace-navigates a stale page to the last page while preserving filters", async () => {
    const fetchMock = vi.fn((input: string | URL | Request) => {
      const url = String(input)

      if (url.endsWith("/v1/orientations")) {
        return Promise.resolve(jsonResponse({ orientations: [] }))
      }

      if (url.endsWith("/v1/issuers")) {
        return Promise.resolve(jsonResponse({ issuers }))
      }
      if (url.endsWith("/v1/compositions")) {
        return Promise.resolve(jsonResponse({ compositions: [] }))
      }
      if (url.endsWith("/v1/shapes")) {
        return Promise.resolve(jsonResponse({ shapes: [] }))
      }
      if (url.endsWith("/v1/tags")) {
        return Promise.resolve(jsonResponse({ tags: [] }))
      }
      if (url.endsWith("/v1/distributions")) {
        return Promise.resolve(jsonResponse({ distributions: [] }))
      }

      if (url.endsWith("/v1/techniques")) {
        return Promise.resolve(jsonResponse({ techniques: [] }))
      }
      if (url.endsWith("/v1/currencies")) {
        return Promise.resolve(jsonResponse({ currencies: [] }))
      }
      if (url.endsWith("/v1/mints")) {
        return Promise.resolve(jsonResponse({ mints: [] }))
      }
      if (url.endsWith("/v1/engravers")) {
        return Promise.resolve(jsonResponse({ engravers: [] }))
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
      search: { issuer: "AR", page: 9 },
    })

    expect(
      await screen.findByRole("link", { name: "Last-page coin" })
    ).toBeVisible()
    expect(router.state.location.search).toEqual({
      issuer: "AR",
      page: 3,
    })
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/v1/coins?issuer=AR&page=9&pageSize=24"
    )
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/v1/coins?issuer=AR&page=3&pageSize=24"
    )

    router.history.back()
    await waitFor(() => expect(router.state.location.searchStr).toBe(""))
    expect(screen.getByRole("link", { name: "First coin" })).toBeVisible()
  })

  it("restores a filtered page URL and Coins with browser Back and Forward", async () => {
    vi.stubGlobal("fetch", vi.fn(createPageAwareArchiveFetch()))
    const router = renderArchiveRoute("/?issuer=AR")
    const user = userEvent.setup()

    await screen.findByRole("link", { name: "Coin on page 1" })
    await user.click(screen.getByRole("button", { name: "Go to page 2" }))
    expect(
      await screen.findByRole("link", { name: "Coin on page 2" })
    ).toBeVisible()
    expect(router.state.location.searchStr).toBe("?issuer=AR&page=2")

    router.history.back()
    expect(
      await screen.findByRole("link", { name: "Coin on page 1" })
    ).toBeVisible()
    expect(router.state.location.searchStr).toBe("?issuer=AR")

    router.history.forward()
    expect(
      await screen.findByRole("link", { name: "Coin on page 2" })
    ).toBeVisible()
    expect(router.state.location.searchStr).toBe("?issuer=AR&page=2")
  })

  it("normalizes zero matches to page 1 without pagination controls", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        createArchiveFetch({
          coins: [],
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
})
