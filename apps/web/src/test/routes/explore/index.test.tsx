import { createMemoryHistory } from "@tanstack/react-router"
import { act, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  coinDetailQueryOptions,
  coinListQueryOptions,
  issuerListQueryOptions,
} from "@/data/archive"
import { getRouter } from "@/router"
import {
  coinListJsonResponse,
  createArchiveFetch as createArchiveFetchFixture,
  jsonResponse,
  renderArchiveRoute,
} from "@/test/archive-route-test"
import {
  coinDetailFixture,
  coinFaceValueFixture,
  coinListItemFixture,
} from "@/test/coin-fixtures"

const coinId = "00000000-0000-4000-8000-000000000001"
const coin = coinListItemFixture({ id: coinId })
const detailCoin = coinDetailFixture({
  id: coin.id,
  title: coin.title,
  issuer: coin.issuer,
  createdAt: coin.createdAt,
  updatedAt: coin.updatedAt,
})
const issuers = [
  { slug: "argentina", name: "Argentina", code: "AR" },
  { slug: "roman-empire", name: "Roman Empire", code: "ROMAN" },
  { slug: "uruguay", name: "Uruguay", code: "UY" },
]

type CoinListResponseFixture = typeof coin & {
  obverseImageUrl: string | null
  reverseImageUrl: string | null
}

function createDeferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })

  return { promise, resolve }
}

function createArchiveFetch(coins: Array<CoinListResponseFixture> = [coin]) {
  return createArchiveFetchFixture({ coins, issuers })
}

afterEach(() => {
  vi.useRealTimers()
})

describe("Archive landing route", () => {
  it("loads and caches the page selected in the Explore URL", async () => {
    const fetchMock = vi.fn(
      createArchiveFetchFixture({
        coins: [coin],
        issuers,
        pagination: {
          page: 3,
          pageSize: 24,
          totalItems: 49,
          totalPages: 3,
        },
      })
    )
    vi.stubGlobal("fetch", fetchMock)
    const router = renderArchiveRoute("/?page=3")

    expect(
      await screen.findByRole("link", { name: "First coin" })
    ).toBeVisible()
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/v1/coins?page=3&pageSize=24"
    )
    expect(
      router.options.context.queryClient.getQueryState([
        "coins",
        "list",
        {
          page: 3,
        },
      ])?.status
    ).toBe("success")
    expect(router.state.location.searchStr).toBe("?page=3")
  })

  it("keeps the selected Issuer synchronized with URL state", async () => {
    const fetchMock = vi.fn(createArchiveFetch())
    vi.stubGlobal("fetch", fetchMock)
    const router = renderArchiveRoute()
    await screen.findByRole("navigation", { name: "Explore filters" })
    await router.navigate({ to: "/", search: { issuer: "ROMAN" } })

    expect(router.state.location.searchStr).toBe("?issuer=ROMAN")
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/v1/coins?issuer=ROMAN&page=1&pageSize=24"
    )

    await router.navigate({ to: "/", search: {} })

    expect(router.state.location.searchStr).toBe("")

    router.history.back()
    await waitFor(() =>
      expect(router.state.location.searchStr).toBe("?issuer=ROMAN")
    )

    router.history.forward()
    await waitFor(() => expect(router.state.location.searchStr).toBe(""))
  })

  it("loads coins for a selected Distribution and preserves it with Issuer", async () => {
    const fetchMock = vi.fn(createArchiveFetch())
    vi.stubGlobal("fetch", fetchMock)
    const router = renderArchiveRoute(
      "/?distribution=standard-circulation&issuer=AR"
    )

    expect(
      await screen.findByRole("link", { name: "First coin" })
    ).toBeVisible()
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/v1/coins?distribution=standard-circulation&issuer=AR&page=1&pageSize=24"
    )
    expect(router.state.location.searchStr).toBe(
      "?distribution=standard-circulation&issuer=AR"
    )
  })

  it("loads coins for a selected Currency with the other filters", async () => {
    const fetchMock = vi.fn(
      createArchiveFetchFixture({
        coins: [coin],
        currencies: [
          { slug: "argentine-peso", name: "Peso", fullName: "Argentine peso" },
        ],
        distributions: [
          { slug: "standard-circulation", name: "Standard circulation" },
        ],
        issuers,
      })
    )
    vi.stubGlobal("fetch", fetchMock)
    const router = renderArchiveRoute(
      "/?currency=argentine-peso&distribution=standard-circulation&issuer=AR"
    )

    expect(
      await screen.findByRole("link", { name: "First coin" })
    ).toBeVisible()
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/v1/coins?currency=argentine-peso&distribution=standard-circulation&issuer=AR&page=1&pageSize=24"
    )
    expect(router.state.location.search.currency).toBe("argentine-peso")
  })

  it("loads coins for a selected Mint with the other filters", async () => {
    const fetchMock = vi.fn(
      createArchiveFetchFixture({
        coins: [coin],
        issuers,
        mints: [
          {
            slug: "buenos-aires",
            name: "Buenos Aires Mint",
            place: "Buenos Aires",
            country: { slug: "argentina", code: "AR", name: "Argentina" },
          },
        ],
      })
    )
    vi.stubGlobal("fetch", fetchMock)
    const router = renderArchiveRoute("/?issuer=AR&mint=buenos-aires")

    expect(
      await screen.findByRole("link", { name: "First coin" })
    ).toBeVisible()
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/v1/coins?issuer=AR&mint=buenos-aires&page=1&pageSize=24"
    )
    expect(router.state.location.search.mint).toBe("buenos-aires")
  })

  it("loads coins for a selected Engraver with the other filters", async () => {
    const fetchMock = vi.fn(
      createArchiveFetchFixture({
        coins: [coin],
        engravers: [{ slug: "first-engraver", fullName: "First Engraver" }],
        issuers,
      })
    )
    vi.stubGlobal("fetch", fetchMock)
    const router = renderArchiveRoute("/?engraver=first-engraver&issuer=AR")

    expect(
      await screen.findByRole("link", { name: "First coin" })
    ).toBeVisible()
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/v1/coins?engraver=first-engraver&issuer=AR&page=1&pageSize=24"
    )
    expect(router.state.location.search.engraver).toBe("first-engraver")
  })

  it("loads coins for a selected Ruling Authority with the other filters", async () => {
    const fetchMock = vi.fn(
      createArchiveFetchFixture({
        coins: [coin],
        issuers,
        rulers: [
          {
            slug: "roman-republic",
            name: "Roman Republic",
            role: "Period",
            tenure: null,
          },
        ],
      })
    )
    vi.stubGlobal("fetch", fetchMock)
    const router = renderArchiveRoute("/?issuer=AR&ruler=roman-republic")

    expect(
      await screen.findByRole("link", { name: "First coin" })
    ).toBeVisible()
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/v1/coins?issuer=AR&ruler=roman-republic&page=1&pageSize=24"
    )
    expect(router.state.location.search.ruler).toBe("roman-republic")
  })

  it("shows the route message when the URL Ruling Authority is unknown", async () => {
    vi.stubGlobal("fetch", vi.fn(createArchiveFetch([])))
    renderArchiveRoute("/?ruler=unknown-ruler")

    expect(await screen.findByText("Ruler / Period not found")).toBeVisible()
  })

  it("shows the route message when the URL Engraver is unknown", async () => {
    vi.stubGlobal("fetch", vi.fn(createArchiveFetch([])))
    renderArchiveRoute("/?engraver=unknown-engraver")

    expect(await screen.findByText("Engraver not found")).toBeVisible()
  })

  it("shows the route message when the URL Mint is unknown", async () => {
    vi.stubGlobal("fetch", vi.fn(createArchiveFetch([])))
    renderArchiveRoute("/?mint=unknown-mint")

    expect(await screen.findByText("Mint not found")).toBeVisible()
  })

  it("shows the route message when the URL Currency is unknown", async () => {
    vi.stubGlobal("fetch", vi.fn(createArchiveFetch([])))
    renderArchiveRoute("/?currency=unknown-currency")

    expect(await screen.findByText("Currency not found")).toBeVisible()
  })

  it("shows the Explore filters", async () => {
    vi.stubGlobal("fetch", vi.fn(createArchiveFetch()))

    renderArchiveRoute()

    await screen.findByRole("navigation", {
      name: "Explore filters",
    })
    expect(screen.getByRole("button", { name: "Add filter" })).toBeVisible()
  })

  it("keeps the Explore filters visible while a newly selected Issuer loads", async () => {
    const filteredCoinsResponse = createDeferred<Response>()
    const filteredCoinsRequested = createDeferred<void>()
    const fetchMock = vi.fn((input: string | URL | Request) => {
      const url = String(input)

      if (url.endsWith("/v1/issuers")) {
        return Promise.resolve(jsonResponse({ issuers }))
      }
      if (url.endsWith("/v1/compositions")) {
        return Promise.resolve(jsonResponse({ compositions: [] }))
      }
      if (url.endsWith("/v1/orientations")) {
        return Promise.resolve(jsonResponse({ orientations: [] }))
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

      if (url.endsWith("/v1/coins?issuer=ROMAN&page=1&pageSize=24")) {
        filteredCoinsRequested.resolve()
        return filteredCoinsResponse.promise
      }

      return Promise.resolve(coinListJsonResponse([coin]))
    })
    vi.stubGlobal("fetch", fetchMock)
    const router = renderArchiveRoute()

    await screen.findByRole("link", { name: "First coin" })
    vi.useFakeTimers()
    const navigation = router.navigate({
      to: "/",
      search: { issuer: "ROMAN" },
    })
    await filteredCoinsRequested.promise
    await act(() => vi.advanceTimersByTimeAsync(201))

    expect(
      screen.getAllByRole("navigation", { name: "Explore filters" })[0]
    ).toBeVisible()

    filteredCoinsResponse.resolve(coinListJsonResponse([coin]))
    await act(() => vi.advanceTimersByTimeAsync(500))
    await navigation
    expect(router.state.location.searchStr).toBe("?issuer=ROMAN")
  })

  it("shows the filtered empty state for an Issuer-only result", async () => {
    vi.stubGlobal("fetch", vi.fn(createArchiveFetch([])))

    renderArchiveRoute("/?issuer=AR")

    expect(
      await screen.findByText("No coins match the selected filters.")
    ).toBeVisible()
    expect(screen.queryByRole("combobox", { name: "Issuer" })).toBeNull()
  })

  it("shows the filtered empty state for a Technique-only result", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        createArchiveFetchFixture({
          techniques: [{ slug: "milled", name: "Milled" }],
        })
      )
    )

    renderArchiveRoute("/?technique=milled")

    expect(
      await screen.findByText("No coins match the selected filters.")
    ).toBeVisible()
    expect(
      screen.queryByText("No coins have been added to the archive yet")
    ).toBeNull()
  })

  it("shows the route message when the URL Issuer is unknown", async () => {
    vi.stubGlobal("fetch", vi.fn(createArchiveFetch([])))
    renderArchiveRoute("/?issuer=ZZ")

    expect(await screen.findByText("Issuer not found")).toBeVisible()
    expect(screen.queryByRole("combobox", { name: "Issuer" })).toBeNull()
  })

  it("keeps filtered and unfiltered Coin collections distinct", async () => {
    const fetchMock = vi.fn(createArchiveFetch())
    vi.stubGlobal("fetch", fetchMock)
    const router = renderArchiveRoute("/?issuer=AR")
    await screen.findByRole("link", { name: "First coin" })

    await router.navigate({ to: "/", search: {} })

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/v1/coins?issuer=AR&page=1&pageSize=24"
    )
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/v1/coins?page=1&pageSize=24"
    )
    expect(fetchMock).toHaveBeenCalledTimes(13)
  })

  it.each(["", "A", "ABC_123"])(
    "normalizes malformed Issuer Code %j to the unfiltered route",
    async (issuerCode) => {
      const fetchMock = vi.fn(createArchiveFetch())
      vi.stubGlobal("fetch", fetchMock)
      const search = `?issuer=${encodeURIComponent(issuerCode)}`

      const router = renderArchiveRoute(`/${search}`)

      expect(
        await screen.findByRole("link", { name: "First coin" })
      ).toBeVisible()
      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:3001/v1/coins?page=1&pageSize=24"
      )
      expect(fetchMock).not.toHaveBeenCalledWith(
        `http://localhost:3001/v1/coins?issuer=${encodeURIComponent(issuerCode)}&page=1&pageSize=24`
      )
      expect(screen.queryByRole("combobox", { name: "Issuer" })).toBeNull()
      expect(router.state.location.searchStr).toBe("")
    }
  )

  it("canonicalizes text filters and deduplicates Tags before requesting Coins", async () => {
    const fetchMock = vi.fn(
      createArchiveFetchFixture({
        coins: [coin],
        issuers,
        pagination: { page: 2, pageSize: 24, totalItems: 48, totalPages: 2 },
      })
    )
    vi.stubGlobal("fetch", fetchMock)
    const router = renderArchiveRoute(
      "/?amount=0.5&composition=GoLd&currency=PeSo&distribution=StaNdard&engraver=FiRst&issuer=ar&mint=BuEnOs&orientation=MeDaL&ruler=RoMan&shape=RoUnd&size=25.75&technique=StRuCk&tag=MaP&tag=FLAG&tag=map&tagMatch=ANY&year=1986-1990&page=2"
    )

    await screen.findByText("Currency not found")
    expect(router.state.location.searchStr).toBe(
      "?amount=0.5&composition=gold&currency=peso&distribution=standard&engraver=first&issuer=AR&mint=buenos&orientation=medal&ruler=roman&shape=round&size=25.75&tag=map&tag=flag&tagMatch=any&technique=struck&year=1986-1990&page=2"
    )
    expect(router.history.length).toBe(1)
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/v1/coins?composition=gold&currency=peso&distribution=standard&engraver=first&amount=0.5&issuer=AR&year=1986-1990&mint=buenos&orientation=medal&ruler=roman&shape=round&size=25.75&tag=map&tag=flag&tagMatch=any&technique=struck&page=2&pageSize=24"
    )
  })

  it.each([
    ["ISO", { slug: "argentina", name: "Argentina", code: "AR" }],
    ["Archive-defined", { slug: "roman-empire", name: "Roman Empire", code: "ROMAN" }],
  ])(
    "renders one %s Issuer's persisted Coin tile",
    async (_category, issuer) => {
      const fetchMock = vi.fn(createArchiveFetch([{ ...coin, issuer }]))
      vi.stubGlobal("fetch", fetchMock)

      renderArchiveRoute()

      const link = await screen.findByRole("link", { name: "First coin" })
      expect(link).toHaveAttribute("href", `/coins/${issuer.slug}/first-coin`)
      expect(screen.queryByText(coinId)).not.toBeInTheDocument()
      expect(screen.getAllByText(issuer.name).length).toBeGreaterThan(0)
      expect(fetchMock).toHaveBeenCalledTimes(12)
    }
  )

  it("links a Coin with approved Slugs to its readable detail URL", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        createArchiveFetch([
          {
            ...coin,
            title: "Hamburg",
            slug: "hamburg-2008",
            issuer: { name: "Germany", code: "DE", slug: "germany" },
          },
        ])
      )
    )
    renderArchiveRoute()
    expect(
      await screen.findByRole("link", { name: "Hamburg" })
    ).toHaveAttribute("href", "/coins/germany/hamburg-2008")
  })

  it("bounds Explore Coin animation delays", async () => {
    const coins = Array.from({ length: 20 }, (_, index) => ({
      ...coin,
      id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
      title: `Coin ${index + 1}`,
    }))
    vi.stubGlobal("fetch", vi.fn(createArchiveFetch(coins)))

    renderArchiveRoute()

    expect(await screen.findByRole("link", { name: "Coin 2" })).toHaveStyle({
      animationDelay: "60ms",
    })
    expect(screen.getByRole("link", { name: "Coin 20" })).toHaveStyle({
      animationDelay: "240ms",
    })
  })

  it("shows the empty archive message", async () => {
    vi.stubGlobal("fetch", vi.fn(createArchiveFetch([])))

    renderArchiveRoute()

    expect(
      await screen.findByText("No coins have been added to the archive yet")
    ).toBeInTheDocument()
  })

  it("shows an honest missing-image state without a placeholder image", async () => {
    vi.stubGlobal("fetch", vi.fn(createArchiveFetch()))

    renderArchiveRoute()

    expect(await screen.findByText("Image unavailable")).toBeVisible()
    expect(screen.getByText("2004")).toBeVisible()
    expect(
      screen.queryByRole("img", { name: "Obverse of First coin" })
    ).not.toBeInTheDocument()
  })

  it("shows a normalized Face Value on an Explore card and omits it when absent", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        createArchiveFetch([
          {
            ...coin,
            faceValue: coinFaceValueFixture(),
          },
          {
            ...coin,
            id: "00000000-0000-4000-8000-000000000002",
            title: "Uncurated coin",
            faceValue: null,
          },
        ])
      )
    )

    renderArchiveRoute()

    const curatedCoin = await screen.findByRole("link", { name: "First coin" })
    const uncuratedCoin = screen.getByRole("link", { name: "Uncurated coin" })
    expect(within(curatedCoin).getByText("1 peso")).toBeVisible()
    expect(within(uncuratedCoin).queryByText("1 peso")).not.toBeInTheDocument()
  })

  it("renders a multi-year CE Issue Period on an Explore card", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(createArchiveFetch([{ ...coin, lastIssueYear: 2007 }]))
    )

    renderArchiveRoute()

    expect(await screen.findByText("2004–2007")).toBeVisible()
  })

  it("renders a BCE Issue Period on an Explore card", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        createArchiveFetch([
          { ...coin, firstIssueYear: -44, lastIssueYear: -42 },
        ])
      )
    )

    renderArchiveRoute()

    expect(await screen.findByText("44–42 BCE")).toBeVisible()
    expect(screen.queryByText(/-44|-42/)).not.toBeInTheDocument()
  })

  it("renders a cross-era Issue Period on an Explore card", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        createArchiveFetch([{ ...coin, firstIssueYear: -2, lastIssueYear: 2 }])
      )
    )

    renderArchiveRoute()

    expect(await screen.findByText("2 BCE–2 CE")).toBeVisible()
    expect(screen.queryByText(/-2|year 0/i)).not.toBeInTheDocument()
  })

  it("falls back to the Reverse image when the Obverse image is missing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        createArchiveFetch([
          {
            ...coin,
            obverseImageUrl: null,
            reverseImageUrl: "https://images.example/reverse.webp",
          },
        ])
      )
    )

    renderArchiveRoute()

    expect(
      await screen.findByRole("img", { name: "Reverse of First coin" })
    ).toHaveAttribute("loading", "lazy")
    expect(
      screen.getByRole("img", { name: "Reverse of First coin" })
    ).toHaveAttribute("src", "https://images.example/reverse.webp")
    expect(screen.queryByText("Image unavailable")).not.toBeInTheDocument()
  })

  it("shows loading feedback while the Coin list is pending", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {}))
    )

    renderArchiveRoute()

    expect(await screen.findByText("Loading coins…")).toBeInTheDocument()
  })

  it("distinguishes a malformed Coin list response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: string | URL | Request) => {
        const url = String(input)
        return Promise.resolve(
          url.endsWith("/v1/issuers")
            ? jsonResponse({ issuers })
            : url.endsWith("/v1/currencies")
              ? jsonResponse({ currencies: [] })
              : url.endsWith("/v1/mints")
                ? jsonResponse({ mints: [] })
                : url.endsWith("/v1/engravers")
                  ? jsonResponse({ engravers: [] })
                  : url.endsWith("/v1/rulers")
                    ? jsonResponse({ rulers: [] })
                    : url.endsWith("/v1/compositions")
                      ? jsonResponse({ compositions: [] })
                      : url.endsWith("/v1/orientations")
                        ? jsonResponse({ orientations: [] })
                        : url.endsWith("/v1/shapes")
                          ? jsonResponse({ shapes: [] })
                          : url.endsWith("/v1/tags")
                            ? jsonResponse({ tags: [] })
                            : url.endsWith("/v1/techniques")
                              ? jsonResponse({ techniques: [] })
                              : url.endsWith("/v1/distributions")
                                ? jsonResponse({ distributions: [] })
                                : coinListJsonResponse([{ id: coinId }])
        )
      })
    )

    renderArchiveRoute()

    expect(
      await screen.findByText("Invalid coin list response")
    ).toBeInTheDocument()
    expect(
      screen.getByRole("navigation", { name: "Explore filters" })
    ).toBeVisible()
  })

  it("shows Coin request failures while preserving the filters", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: string | URL | Request) => {
        const url = String(input)
        if (url.endsWith("/v1/issuers")) {
          return Promise.resolve(jsonResponse({ issuers }))
        }
        if (url.endsWith("/v1/compositions")) {
          return Promise.resolve(jsonResponse({ compositions: [] }))
        }
        if (url.endsWith("/v1/orientations")) {
          return Promise.resolve(jsonResponse({ orientations: [] }))
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
        return Promise.reject(new TypeError("offline"))
      })
    )

    renderArchiveRoute()

    expect(await screen.findByText("Unable to load coins")).toBeInTheDocument()
    expect(
      screen.getByRole("navigation", { name: "Explore filters" })
    ).toBeVisible()
  })

  it("shows Coin server failures while preserving the filters", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: string | URL | Request) =>
        Promise.resolve(
          String(input).endsWith("/v1/issuers")
            ? jsonResponse({ issuers })
            : String(input).endsWith("/v1/currencies")
              ? jsonResponse({ currencies: [] })
              : String(input).endsWith("/v1/mints")
                ? jsonResponse({ mints: [] })
                : String(input).endsWith("/v1/engravers")
                  ? jsonResponse({ engravers: [] })
                  : String(input).endsWith("/v1/rulers")
                    ? jsonResponse({ rulers: [] })
                    : String(input).endsWith("/v1/compositions")
                      ? jsonResponse({ compositions: [] })
                      : String(input).endsWith("/v1/orientations")
                        ? jsonResponse({ orientations: [] })
                        : String(input).endsWith("/v1/shapes")
                          ? jsonResponse({ shapes: [] })
                          : String(input).endsWith("/v1/tags")
                            ? jsonResponse({ tags: [] })
                            : String(input).endsWith("/v1/techniques")
                              ? jsonResponse({ techniques: [] })
                              : String(input).endsWith("/v1/distributions")
                                ? jsonResponse({ distributions: [] })
                                : jsonResponse({ error: {} }, 503)
        )
      )
    )

    renderArchiveRoute()

    expect(await screen.findByText("Unable to load coins")).toBeInTheDocument()
    expect(
      screen.getByRole("navigation", { name: "Explore filters" })
    ).toBeVisible()
  })

  it("uses the route error state for an invalid Issuer response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: string | URL | Request) =>
        Promise.resolve(
          String(input).endsWith("/v1/issuers")
            ? jsonResponse({ issuers: [{ name: "Argentina", id: "internal" }] })
            : String(input).endsWith("/v1/currencies")
              ? jsonResponse({ currencies: [] })
              : String(input).endsWith("/v1/mints")
                ? jsonResponse({ mints: [] })
                : String(input).endsWith("/v1/engravers")
                  ? jsonResponse({ engravers: [] })
                  : String(input).endsWith("/v1/rulers")
                    ? jsonResponse({ rulers: [] })
                    : String(input).endsWith("/v1/compositions")
                      ? jsonResponse({ compositions: [] })
                      : String(input).endsWith("/v1/orientations")
                        ? jsonResponse({ orientations: [] })
                        : String(input).endsWith("/v1/shapes")
                          ? jsonResponse({ shapes: [] })
                          : String(input).endsWith("/v1/tags")
                            ? jsonResponse({ tags: [] })
                            : String(input).endsWith("/v1/techniques")
                              ? jsonResponse({ techniques: [] })
                              : String(input).endsWith("/v1/distributions")
                                ? jsonResponse({ distributions: [] })
                                : coinListJsonResponse([coin])
        )
      )
    )

    renderArchiveRoute()

    expect(
      await screen.findByText("Invalid issuer list response")
    ).toBeVisible()
    expect(
      screen.queryByRole("navigation", { name: "Explore filters" })
    ).toBeNull()
  })

  it("uses the route error state when the Issuer request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: string | URL | Request) => {
        const url = String(input)
        return url.endsWith("/v1/issuers")
          ? Promise.reject(new TypeError("offline"))
          : url.endsWith("/v1/currencies")
            ? Promise.resolve(jsonResponse({ currencies: [] }))
            : url.endsWith("/v1/mints")
              ? Promise.resolve(jsonResponse({ mints: [] }))
              : url.endsWith("/v1/engravers")
                ? Promise.resolve(jsonResponse({ engravers: [] }))
                : url.endsWith("/v1/rulers")
                  ? Promise.resolve(jsonResponse({ rulers: [] }))
                  : url.endsWith("/v1/compositions")
                    ? Promise.resolve(jsonResponse({ compositions: [] }))
                    : url.endsWith("/v1/orientations")
                      ? jsonResponse({ orientations: [] })
                      : url.endsWith("/v1/shapes")
                        ? Promise.resolve(jsonResponse({ shapes: [] }))
                        : url.endsWith("/v1/tags")
                          ? Promise.resolve(jsonResponse({ tags: [] }))
                          : url.endsWith("/v1/techniques")
                            ? Promise.resolve(jsonResponse({ techniques: [] }))
                            : url.endsWith("/v1/distributions")
                              ? Promise.resolve(
                                  jsonResponse({ distributions: [] })
                                )
                              : Promise.resolve(coinListJsonResponse([coin]))
      })
    )

    renderArchiveRoute()

    expect(await screen.findByText("Unable to load issuers")).toBeVisible()
    expect(
      screen.queryByRole("navigation", { name: "Explore filters" })
    ).toBeNull()
  })

  it("accepts expanded rollout responses while navigating to Coin detail", async () => {
    const fetchMock = vi.fn((input: string | URL | Request) => {
      const url = String(input)
      return Promise.resolve(
        url.endsWith("/v1/issuers")
          ? jsonResponse({ issuers })
          : url.endsWith("/v1/currencies")
            ? jsonResponse({ currencies: [] })
            : url.endsWith("/v1/mints")
              ? jsonResponse({ mints: [] })
              : url.endsWith("/v1/engravers")
                ? jsonResponse({ engravers: [] })
                : url.endsWith("/v1/rulers")
                  ? jsonResponse({ rulers: [] })
                  : url.endsWith("/v1/compositions")
                    ? jsonResponse({ compositions: [] })
                    : url.endsWith("/v1/orientations")
                      ? jsonResponse({ orientations: [] })
                      : url.endsWith("/v1/shapes")
                        ? jsonResponse({ shapes: [] })
                        : url.endsWith("/v1/tags")
                          ? jsonResponse({ tags: [] })
                          : url.endsWith("/v1/techniques")
                            ? jsonResponse({ techniques: [] })
                            : url.endsWith("/v1/distributions")
                              ? jsonResponse({ distributions: [] })
                              : url.endsWith(`/v1/coins/by-slug/first-coin`)
                                ? jsonResponse({
                                    ...detailCoin,
                                    obverse: {
                                      description: "A portrait",
                                      imageUrl:
                                        "https://images.example/obverse.webp",
                                      createdAt: "2026-09-16T10:30:00.000Z",
                                      updatedAt: "2026-09-16T10:45:00.000Z",
                                      engravers: [],
                                    },
                                  })
                                : coinListJsonResponse([
                                    {
                                      ...coin,
                                      obverseImageUrl:
                                        "https://images.example/obverse.webp",
                                      reverseImageUrl:
                                        "https://images.example/reverse.webp",
                                    },
                                  ])
      )
    })
    vi.stubGlobal("fetch", fetchMock)
    const user = userEvent.setup()
    const router = renderArchiveRoute()
    const coinLink = await screen.findByRole("link", { name: "First coin" })

    expect(
      screen.getByRole("img", { name: "Obverse of First coin" })
    ).toHaveAttribute("src", "https://images.example/obverse.webp")

    expect(
      router.options.context.queryClient.getQueryState([
        "coins",
        "detail",
        coinId,
      ])?.dataUpdatedAt
    ).toBeUndefined()

    await user.click(coinLink)

    expect(
      await screen.findByRole("heading", { name: "First coin" })
    ).toBeInTheDocument()
    expect(screen.getByText("A portrait")).toBeInTheDocument()
    expect(router.state.location.pathname).toBe(`/coins/argentina/first-coin`)
    expect(screen.queryByText("Loading coin…")).not.toBeInTheDocument()
    expect(
      fetchMock.mock.calls.filter(([input]) =>
        String(input).endsWith(`/v1/coins/by-slug/first-coin`)
      )
    ).toHaveLength(1)
  })

  it("does not show pending feedback when Coin detail resolves quickly", async () => {
    const detailResponse = createDeferred<Response>()
    const detailRequested = createDeferred<void>()
    const fetchMock = vi.fn((input: string | URL | Request) => {
      const url = String(input)

      if (url.endsWith(`/v1/coins/by-slug/first-coin`)) {
        detailRequested.resolve()
        return detailResponse.promise
      }

      return Promise.resolve(
        url.endsWith("/v1/issuers")
          ? jsonResponse({ issuers })
          : url.endsWith("/v1/currencies")
            ? jsonResponse({ currencies: [] })
            : url.endsWith("/v1/mints")
              ? jsonResponse({ mints: [] })
              : url.endsWith("/v1/engravers")
                ? jsonResponse({ engravers: [] })
                : url.endsWith("/v1/rulers")
                  ? jsonResponse({ rulers: [] })
                  : url.endsWith("/v1/compositions")
                    ? jsonResponse({ compositions: [] })
                    : url.endsWith("/v1/orientations")
                      ? jsonResponse({ orientations: [] })
                      : url.endsWith("/v1/shapes")
                        ? jsonResponse({ shapes: [] })
                        : url.endsWith("/v1/tags")
                          ? jsonResponse({ tags: [] })
                          : url.endsWith("/v1/techniques")
                            ? jsonResponse({ techniques: [] })
                            : url.endsWith("/v1/distributions")
                              ? jsonResponse({ distributions: [] })
                              : coinListJsonResponse([coin])
      )
    })
    vi.stubGlobal("fetch", fetchMock)
    const router = renderArchiveRoute()
    const coinLink = await screen.findByRole("link", { name: "First coin" })
    router.options.context.queryClient.removeQueries({
      queryKey: ["coins", "slug", "first-coin"],
    })
    vi.useFakeTimers()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

    const navigation = user.click(coinLink)
    await detailRequested.promise
    await act(() => vi.advanceTimersByTimeAsync(100))

    expect(screen.queryByText("Loading coin…")).not.toBeInTheDocument()

    detailResponse.resolve(jsonResponse(detailCoin))
    await act(() => vi.advanceTimersByTimeAsync(500))
    await navigation
    expect(screen.getByRole("heading", { name: "First coin" })).toBeVisible()
    expect(screen.queryByText("Loading coin…")).not.toBeInTheDocument()
  })

  it("shows pending feedback when Coin detail remains slow", async () => {
    const detailResponse = createDeferred<Response>()
    const detailRequested = createDeferred<void>()
    vi.stubGlobal(
      "fetch",
      vi.fn((input: string | URL | Request) => {
        const url = String(input)

        if (url.endsWith(`/v1/coins/by-slug/first-coin`)) {
          detailRequested.resolve()
          return detailResponse.promise
        }

        return Promise.resolve(
          url.endsWith("/v1/issuers")
            ? jsonResponse({ issuers })
            : url.endsWith("/v1/currencies")
              ? jsonResponse({ currencies: [] })
              : url.endsWith("/v1/mints")
                ? jsonResponse({ mints: [] })
                : url.endsWith("/v1/engravers")
                  ? jsonResponse({ engravers: [] })
                  : url.endsWith("/v1/rulers")
                    ? jsonResponse({ rulers: [] })
                    : url.endsWith("/v1/compositions")
                      ? jsonResponse({ compositions: [] })
                      : url.endsWith("/v1/orientations")
                        ? jsonResponse({ orientations: [] })
                        : url.endsWith("/v1/shapes")
                          ? jsonResponse({ shapes: [] })
                          : url.endsWith("/v1/tags")
                            ? jsonResponse({ tags: [] })
                            : url.endsWith("/v1/techniques")
                              ? jsonResponse({ techniques: [] })
                              : url.endsWith("/v1/distributions")
                                ? jsonResponse({ distributions: [] })
                                : coinListJsonResponse([coin])
        )
      })
    )
    const router = renderArchiveRoute()
    const coinLink = await screen.findByRole("link", { name: "First coin" })
    router.options.context.queryClient.removeQueries({
      queryKey: ["coins", "slug", "first-coin"],
    })
    vi.useFakeTimers()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

    const navigation = user.click(coinLink)
    await detailRequested.promise
    await act(() => vi.advanceTimersByTimeAsync(201))

    expect(screen.getByText("Loading coin…")).toBeVisible()

    detailResponse.resolve(jsonResponse(detailCoin))
    await act(() => vi.advanceTimersByTimeAsync(500))
    await navigation
    expect(screen.getByRole("heading", { name: "First coin" })).toBeVisible()
  })

  it("reuses independently preloaded Coin detail during navigation", async () => {
    const fetchMock = vi.fn((input: string | URL | Request) => {
      const url = String(input)

      return Promise.resolve(
        url.endsWith("/v1/issuers")
          ? jsonResponse({ issuers })
          : url.endsWith("/v1/currencies")
            ? jsonResponse({ currencies: [] })
            : url.endsWith("/v1/mints")
              ? jsonResponse({ mints: [] })
              : url.endsWith("/v1/engravers")
                ? jsonResponse({ engravers: [] })
                : url.endsWith("/v1/rulers")
                  ? jsonResponse({ rulers: [] })
                  : url.endsWith("/v1/compositions")
                    ? jsonResponse({ compositions: [] })
                    : url.endsWith("/v1/orientations")
                      ? jsonResponse({ orientations: [] })
                      : url.endsWith("/v1/shapes")
                        ? jsonResponse({ shapes: [] })
                        : url.endsWith("/v1/tags")
                          ? jsonResponse({ tags: [] })
                          : url.endsWith("/v1/techniques")
                            ? jsonResponse({ techniques: [] })
                            : url.endsWith("/v1/distributions")
                              ? jsonResponse({ distributions: [] })
                              : url.endsWith(`/v1/coins/by-slug/first-coin`)
                                ? jsonResponse(detailCoin)
                                : coinListJsonResponse([coin])
      )
    })
    vi.stubGlobal("fetch", fetchMock)
    const user = userEvent.setup()
    renderArchiveRoute()
    const coinLink = await screen.findByRole("link", { name: "First coin" })

    await user.hover(coinLink)
    await user.click(coinLink)

    expect(
      await screen.findByRole("heading", { name: "First coin" })
    ).toBeVisible()
    expect(screen.queryByText("Loading coin…")).not.toBeInTheDocument()
    expect(
      fetchMock.mock.calls.filter(([input]) =>
        String(input).endsWith(`/v1/coins/by-slug/first-coin`)
      )
    ).toHaveLength(1)
  })

  it("configures intent preloading for router navigations", () => {
    const router = getRouter({
      history: createMemoryHistory({ initialEntries: ["/"] }),
    })

    expect(router.options.defaultPreload).toBe("intent")
  })

  it("retains browser navigation queries for 30 minutes without changing freshness", () => {
    const router = getRouter({
      history: createMemoryHistory({ initialEntries: ["/"] }),
    })

    expect(
      router.options.context.queryClient.getDefaultOptions().queries?.gcTime
    ).toBe(30 * 60 * 1_000)
    expect(coinListQueryOptions().staleTime).toBe(30_000)
    expect(coinDetailQueryOptions(coinId).staleTime).toBe(30_000)
    expect(issuerListQueryOptions().staleTime).toBe(Infinity)
  })

  it("enables view transitions for router navigations", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {}))
    )

    const router = renderArchiveRoute()

    expect(router.options.defaultViewTransition).toBe(true)
  })
})
