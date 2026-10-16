import { createMemoryHistory } from "@tanstack/react-router"
import { act, fireEvent, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { CoinListItemResponse } from "@workspace/api"

import {
  coinDetailQueryOptions,
  coinListQueryOptions,
  engraverListQueryOptions,
  issuerListQueryOptions,
} from "@/data/archive"
import { getRouter } from "@/router"
import {
  coinListJsonResponse,
  createArchiveFetch as createArchiveFetchFixture,
  jsonResponse,
  renderArchiveRoute,
} from "@/test/archive-route-test"
import { coinDetailFixture } from "@/test/coin-fixtures"

const coinId = "00000000-0000-4000-8000-000000000001"
const coin: CoinListItemResponse = {
  id: coinId,
  title: "First coin",
  firstIssueYear: 2004,
  lastIssueYear: 2004,
  issuer: { name: "Argentina", code: "AR" },
  createdAt: "2026-09-16T10:00:00.000Z",
  updatedAt: "2026-09-16T11:00:00.000Z",
  obverseImageUrl: null,
  reverseImageUrl: null,
}
const detailCoin = coinDetailFixture({
  id: coin.id,
  title: coin.title,
  issuer: coin.issuer,
  createdAt: coin.createdAt,
  updatedAt: coin.updatedAt,
})
const issuers = [
  { name: "Argentina", code: "AR" },
  { name: "Roman Empire", code: "ROMAN" },
  { name: "Uruguay", code: "UY" },
]
const engravers = [
  { slug: "first-engraver", fullName: "First Engraver" },
  { slug: "second-engraver", fullName: "Second Engraver" },
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
  return createArchiveFetchFixture({ coins, engravers, issuers })
}

afterEach(() => {
  vi.useRealTimers()
})

describe("Archive landing route", () => {
  it("loads and caches the page selected in the Explore URL", async () => {
    const fetchMock = vi.fn(
      createArchiveFetchFixture({
        coins: [coin],
        engravers,
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
          engraverSlug: null,
          issuerCode: null,
          page: 3,
          pageSize: 24,
        },
      ])?.status
    ).toBe("success")
    expect(router.state.location.searchStr).toBe("?page=3")
  })

  it("loads Coins, Issuers, and Engravers concurrently and keeps loading until all are ready", async () => {
    const coinsResponse = createDeferred<Response>()
    const issuersResponse = createDeferred<Response>()
    const engraversResponse = createDeferred<Response>()
    const filteredCoinsResponse = createDeferred<Response>()
    const fetchMock = vi.fn((input: string | URL | Request) => {
      const url = String(input)

      if (url.endsWith("/v1/issuers")) return issuersResponse.promise
      if (url.endsWith("/v1/engravers")) return engraversResponse.promise
      if (url.endsWith("/v1/coins?issuer=ROMAN&page=1&pageSize=24")) {
        return filteredCoinsResponse.promise
      }
      return coinsResponse.promise
    })
    vi.stubGlobal("fetch", fetchMock)

    const router = renderArchiveRoute("/?issuer=AR")

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3))
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/v1/coins?issuer=AR&page=1&pageSize=24"
    )
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:3001/v1/issuers")
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:3001/v1/engravers")
    expect(await screen.findByText("Loading coins…")).toBeVisible()

    issuersResponse.resolve(
      jsonResponse({ issuers: [{ name: "Argentina", code: "AR" }] })
    )
    await waitFor(() =>
      expect(
        router.options.context.queryClient.getQueryState(["issuers", "list"])
          ?.status
      ).toBe("success")
    )
    expect(router.state.status).toBe("pending")
    expect(screen.getByText("Loading coins…")).toBeVisible()

    engraversResponse.resolve(jsonResponse({ engravers }))
    await waitFor(() =>
      expect(
        router.options.context.queryClient.getQueryState(["engravers", "list"])
          ?.status
      ).toBe("success")
    )
    expect(router.state.status).toBe("pending")
    expect(screen.getByText("Loading coins…")).toBeVisible()

    coinsResponse.resolve(coinListJsonResponse([coin]))
    expect(
      await screen.findByRole("link", { name: "First coin" })
    ).toBeVisible()
    expect(router.state.status).toBe("idle")
    expect(screen.getByRole("combobox", { name: "Issuer" })).toHaveValue(
      "Argentina"
    )
    expect(router.state.location.searchStr).toBe("?issuer=AR")

    const navigation = router.navigate({
      to: "/",
      search: { issuer: "ROMAN" },
    })
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:3001/v1/coins?issuer=ROMAN&page=1&pageSize=24"
      )
    )
    const settlement = await Promise.race([
      navigation.then(() => "settled" as const),
      new Promise<"pending">((resolve) => {
        setTimeout(() => resolve("pending"), 0)
      }),
    ])

    expect(settlement).toBe("pending")
    filteredCoinsResponse.resolve(coinListJsonResponse([coin]))
    await navigation
    expect(router.state.location.searchStr).toBe("?issuer=ROMAN")
  })

  it("keeps the selected Issuer synchronized with URL state", async () => {
    const fetchMock = vi.fn(createArchiveFetch())
    vi.stubGlobal("fetch", fetchMock)
    const router = renderArchiveRoute()
    const select = await screen.findByRole("combobox", { name: "Issuer" })

    expect(select).toHaveValue("")
    expect(select).toHaveAttribute("placeholder", "All issuers")
    await router.navigate({ to: "/", search: { issuer: "ROMAN" } })

    expect(router.state.location.searchStr).toBe("?issuer=ROMAN")
    expect(select).toHaveValue("Roman Empire")
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/v1/coins?issuer=ROMAN&page=1&pageSize=24"
    )

    await router.navigate({ to: "/", search: {} })

    expect(router.state.location.searchStr).toBe("")
    expect(select).toHaveValue("")

    router.history.back()
    await waitFor(() =>
      expect(router.state.location.searchStr).toBe("?issuer=ROMAN")
    )
    expect(select).toHaveValue("Roman Empire")

    router.history.forward()
    await waitFor(() => expect(router.state.location.searchStr).toBe(""))
    expect(select).toHaveValue("")
  })

  it("clears only the selected Engraver", async () => {
    vi.stubGlobal("fetch", vi.fn(createArchiveFetch()))
    const router = renderArchiveRoute("/?issuer=AR&engraver=first-engraver")
    const combobox = await screen.findByRole("combobox", { name: "Engraver" })

    expect(combobox).toHaveValue("First Engraver")
    const engraverControl = combobox.parentElement
    if (!engraverControl) throw new Error("Engraver combobox control not found")

    fireEvent.click(
      within(engraverControl).getByRole("button", { name: "Clear" })
    )

    await waitFor(() =>
      expect(router.state.location.searchStr).toBe("?issuer=AR")
    )
    expect(combobox).toHaveValue("")
    expect(combobox).toHaveAttribute("placeholder", "All engravers")

    router.history.back()
    await waitFor(() =>
      expect(router.state.location.searchStr).toBe(
        "?issuer=AR&engraver=first-engraver"
      )
    )
    expect(combobox).toHaveValue("First Engraver")

    router.history.forward()
    await waitFor(() =>
      expect(router.state.location.searchStr).toBe("?issuer=AR")
    )
    expect(combobox).toHaveValue("")
  })

  it("filters Coins by a valid Engraver Slug and combines it with an Issuer", async () => {
    const fetchMock = vi.fn((input: string | URL | Request) => {
      const url = String(input)

      if (url.endsWith("/v1/issuers")) {
        return Promise.resolve(jsonResponse({ issuers }))
      }

      if (url.endsWith("/v1/engravers")) {
        return Promise.resolve(
          jsonResponse({
            engravers: [{ slug: "first-engraver", fullName: "First Engraver" }],
          })
        )
      }

      return Promise.resolve(coinListJsonResponse([coin]))
    })
    vi.stubGlobal("fetch", fetchMock)

    const router = renderArchiveRoute("/?issuer=ROMAN&engraver=first-engraver")

    expect(
      await screen.findByRole("link", { name: "First coin" })
    ).toBeVisible()
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/v1/coins?issuer=ROMAN&engraver=first-engraver&page=1&pageSize=24"
    )
    expect(router.state.location.search).toEqual({
      issuer: "ROMAN",
      engraver: "first-engraver",
    })
  })

  it("normalizes a malformed Engraver Slug away without removing a valid Issuer", async () => {
    const fetchMock = vi.fn(createArchiveFetch())
    vi.stubGlobal("fetch", fetchMock)

    const router = renderArchiveRoute("/?issuer=AR&engraver=First--Engraver")

    expect(
      await screen.findByRole("link", { name: "First coin" })
    ).toBeVisible()
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/v1/coins?issuer=AR&page=1&pageSize=24"
    )
    expect(router.state.location.search).toEqual({
      issuer: "AR",
      engraver: undefined,
    })
    expect(router.state.location.searchStr).toBe("?issuer=AR")
  })

  it("keeps a syntactically valid unknown Engraver Slug in URL state", async () => {
    const fetchMock = vi.fn(createArchiveFetch([]))
    vi.stubGlobal("fetch", fetchMock)

    const router = renderArchiveRoute("/?engraver=unknown-engraver")

    expect(await screen.findByText("Engraver not found")).toBeVisible()
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/v1/coins?engraver=unknown-engraver&page=1&pageSize=24"
    )
    expect(router.state.location.search).toEqual({
      engraver: "unknown-engraver",
    })
    expect(router.state.location.searchStr).toBe("?engraver=unknown-engraver")
  })

  it("shows the filtered empty state for an Engraver-only result", async () => {
    vi.stubGlobal("fetch", vi.fn(createArchiveFetch([])))

    renderArchiveRoute("/?engraver=first-engraver")

    expect(
      await screen.findByText("No coins match the selected filters.")
    ).toBeVisible()
  })

  it("shows the filtered empty state for combined Issuer and Engraver results", async () => {
    vi.stubGlobal("fetch", vi.fn(createArchiveFetch([])))

    renderArchiveRoute("/?issuer=ROMAN&engraver=first-engraver")

    expect(
      await screen.findByText("No coins match the selected filters.")
    ).toBeVisible()
  })

  it("keeps every normalized Issuer and Engraver filter combination in a distinct cache entry", async () => {
    const fetchMock = vi.fn(createArchiveFetch())
    vi.stubGlobal("fetch", fetchMock)
    const router = renderArchiveRoute()
    await screen.findByRole("link", { name: "First coin" })

    await router.navigate({ to: "/", search: { issuer: "AR" } })
    await router.navigate({
      to: "/",
      search: { engraver: "first-engraver" },
    })
    await router.navigate({
      to: "/",
      search: { issuer: "AR", engraver: "first-engraver" },
    })

    const queryClient = router.options.context.queryClient
    for (const filters of [
      { issuerCode: null, engraverSlug: null, page: 1, pageSize: 24 },
      { issuerCode: "AR", engraverSlug: null, page: 1, pageSize: 24 },
      {
        issuerCode: null,
        engraverSlug: "first-engraver",
        page: 1,
        pageSize: 24,
      },
      {
        issuerCode: "AR",
        engraverSlug: "first-engraver",
        page: 1,
        pageSize: 24,
      },
    ]) {
      expect(
        queryClient.getQueryState(["coins", "list", filters])?.status
      ).toBe("success")
    }
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/v1/coins?page=1&pageSize=24"
    )
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/v1/coins?issuer=AR&page=1&pageSize=24"
    )
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/v1/coins?engraver=first-engraver&page=1&pageSize=24"
    )
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/v1/coins?issuer=AR&engraver=first-engraver&page=1&pageSize=24"
    )
  })

  it("restores Engraver-filtered results with browser Back and Forward", async () => {
    const fetchMock = vi.fn((input: string | URL | Request) => {
      const url = String(input)
      if (url.endsWith("/v1/issuers")) {
        return Promise.resolve(jsonResponse({ issuers }))
      }
      if (url.endsWith("/v1/engravers")) {
        return Promise.resolve(jsonResponse({ engravers }))
      }
      return Promise.resolve(
        coinListJsonResponse([
          url.includes("engraver=second-engraver")
            ? { ...coin, title: "Second coin" }
            : coin,
        ])
      )
    })
    vi.stubGlobal("fetch", fetchMock)
    const router = renderArchiveRoute("/?engraver=first-engraver")
    expect(
      await screen.findByRole("link", { name: "First coin" })
    ).toBeVisible()

    await router.navigate({
      to: "/",
      search: { engraver: "second-engraver" },
    })
    expect(
      await screen.findByRole("link", { name: "Second coin" })
    ).toBeVisible()

    router.history.back()
    expect(
      await screen.findByRole("link", { name: "First coin" })
    ).toBeVisible()
    expect(router.state.location.searchStr).toBe("?engraver=first-engraver")

    router.history.forward()
    expect(
      await screen.findByRole("link", { name: "Second coin" })
    ).toBeVisible()
    expect(router.state.location.searchStr).toBe("?engraver=second-engraver")
  })

  it("places the Issuer select in the Explore filters navigation", async () => {
    vi.stubGlobal("fetch", vi.fn(createArchiveFetch()))

    renderArchiveRoute()

    const filters = await screen.findByRole("navigation", {
      name: "Explore filters",
    })
    expect(filters).toContainElement(
      screen.getByRole("combobox", { name: "Issuer" })
    )
  })

  it("keeps the Explore filters visible while a newly selected Issuer loads", async () => {
    const filteredCoinsResponse = createDeferred<Response>()
    const filteredCoinsRequested = createDeferred<void>()
    const fetchMock = vi.fn((input: string | URL | Request) => {
      const url = String(input)

      if (url.endsWith("/v1/issuers")) {
        return Promise.resolve(jsonResponse({ issuers }))
      }

      if (url.endsWith("/v1/engravers")) {
        return Promise.resolve(jsonResponse({ engravers }))
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

    expect(screen.getByRole("navigation")).toBeVisible()
    expect(screen.getByRole("combobox", { name: "Issuer" })).toBeVisible()

    filteredCoinsResponse.resolve(coinListJsonResponse([coin]))
    await act(() => vi.advanceTimersByTimeAsync(500))
    await navigation
    expect(screen.getByRole("combobox", { name: "Issuer" })).toHaveValue(
      "Roman Empire"
    )
  })

  it("shows the filtered empty state for an Issuer-only result", async () => {
    vi.stubGlobal("fetch", vi.fn(createArchiveFetch([])))

    renderArchiveRoute("/?issuer=AR")

    expect(
      await screen.findByText("No coins match the selected filters.")
    ).toBeVisible()
    expect(screen.getByRole("combobox", { name: "Issuer" })).toHaveValue(
      "Argentina"
    )
  })

  it("keeps the populated select available when the URL Issuer is unknown", async () => {
    vi.stubGlobal("fetch", vi.fn(createArchiveFetch([])))
    renderArchiveRoute("/?issuer=ZZ")

    expect(await screen.findByText("Issuer not found")).toBeVisible()
    const combobox = screen.getByRole("combobox", { name: "Issuer" })
    expect(combobox).toHaveValue("Unknown issuer (ZZ)")
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
    expect(fetchMock).toHaveBeenCalledTimes(4)
  })

  it.each(["", "ar", "A", "ABC_123"])(
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
      expect(screen.getByRole("combobox", { name: "Issuer" })).toHaveValue("")
      expect(router.state.location.searchStr).toBe("")
    }
  )

  it.each([
    ["ISO", { name: "Argentina", code: "AR" }],
    ["Archive-defined", { name: "Roman Empire", code: "ROMAN" }],
  ])(
    "renders one %s Issuer's persisted Coin tile",
    async (_category, issuer) => {
      const fetchMock = vi.fn(createArchiveFetch([{ ...coin, issuer }]))
      vi.stubGlobal("fetch", fetchMock)

      renderArchiveRoute()

      const link = await screen.findByRole("link", { name: "First coin" })
      expect(link).toHaveAttribute("href", `/coins/${coinId}`)
      expect(screen.queryByText(coinId)).not.toBeInTheDocument()
      expect(screen.getAllByText(issuer.name).length).toBeGreaterThan(0)
      expect(fetchMock).toHaveBeenCalledTimes(3)
    }
  )

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
            : url.endsWith("/v1/engravers")
              ? jsonResponse({ engravers })
              : coinListJsonResponse([{ id: coinId }])
        )
      })
    )

    renderArchiveRoute()

    expect(
      await screen.findByText("Invalid coin list response")
    ).toBeInTheDocument()
    expect(screen.getByRole("combobox", { name: "Issuer" })).toBeVisible()
  })

  it("shows Coin request failures while preserving the filters", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: string | URL | Request) => {
        const url = String(input)
        if (url.endsWith("/v1/issuers")) {
          return Promise.resolve(jsonResponse({ issuers }))
        }
        if (url.endsWith("/v1/engravers")) {
          return Promise.resolve(jsonResponse({ engravers }))
        }
        return Promise.reject(new TypeError("offline"))
      })
    )

    renderArchiveRoute()

    expect(await screen.findByText("Unable to load coins")).toBeInTheDocument()
    expect(screen.getByRole("combobox", { name: "Issuer" })).toBeVisible()
  })

  it("shows Coin server failures while preserving the filters", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: string | URL | Request) =>
        Promise.resolve(
          String(input).endsWith("/v1/issuers")
            ? jsonResponse({ issuers })
            : String(input).endsWith("/v1/engravers")
              ? jsonResponse({ engravers })
              : jsonResponse({ error: {} }, 503)
        )
      )
    )

    renderArchiveRoute()

    expect(await screen.findByText("Unable to load coins")).toBeInTheDocument()
    expect(screen.getByRole("combobox", { name: "Issuer" })).toBeVisible()
  })

  it("uses the route error state for an invalid Issuer response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: string | URL | Request) =>
        Promise.resolve(
          String(input).endsWith("/v1/issuers")
            ? jsonResponse({ issuers: [{ name: "Argentina", id: "internal" }] })
            : String(input).endsWith("/v1/engravers")
              ? jsonResponse({ engravers })
              : coinListJsonResponse([coin])
        )
      )
    )

    renderArchiveRoute()

    expect(
      await screen.findByText("Invalid issuer list response")
    ).toBeVisible()
    expect(screen.queryByRole("combobox", { name: "Issuer" })).toBeNull()
  })

  it("uses the route error state when the Issuer request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: string | URL | Request) => {
        const url = String(input)
        return url.endsWith("/v1/issuers")
          ? Promise.reject(new TypeError("offline"))
          : Promise.resolve(
              url.endsWith("/v1/engravers")
                ? jsonResponse({ engravers })
                : coinListJsonResponse([coin])
            )
      })
    )

    renderArchiveRoute()

    expect(await screen.findByText("Unable to load issuers")).toBeVisible()
    expect(screen.queryByRole("combobox", { name: "Issuer" })).toBeNull()
  })

  it("uses the route error state for an invalid Engraver response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: string | URL | Request) => {
        const url = String(input)
        return Promise.resolve(
          url.endsWith("/v1/issuers")
            ? jsonResponse({ issuers })
            : url.endsWith("/v1/engravers")
              ? jsonResponse({
                  engravers: [
                    { slug: "Invalid-Slug", fullName: "First Engraver" },
                  ],
                })
              : coinListJsonResponse([coin])
        )
      })
    )

    renderArchiveRoute()

    expect(
      await screen.findByText("Invalid engraver list response")
    ).toBeVisible()
    expect(screen.queryByRole("combobox", { name: "Issuer" })).toBeNull()
  })

  it("uses the route error state when the Engraver request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: string | URL | Request) => {
        const url = String(input)
        if (url.endsWith("/v1/engravers")) {
          return Promise.reject(new TypeError("offline"))
        }
        return Promise.resolve(
          url.endsWith("/v1/issuers")
            ? jsonResponse({ issuers })
            : coinListJsonResponse([coin])
        )
      })
    )

    renderArchiveRoute()

    expect(await screen.findByText("Unable to load engravers")).toBeVisible()
    expect(screen.queryByRole("combobox", { name: "Issuer" })).toBeNull()
  })

  it("accepts expanded rollout responses while navigating to Coin detail", async () => {
    const fetchMock = vi.fn((input: string | URL | Request) => {
      const url = String(input)
      return Promise.resolve(
        url.endsWith("/v1/issuers")
          ? jsonResponse({ issuers })
          : url.endsWith("/v1/engravers")
            ? jsonResponse({ engravers })
            : url.endsWith(`/v1/coins/${coinId}`)
              ? jsonResponse({
                  ...detailCoin,
                  obverse: {
                    description: "A portrait",
                    imageUrl: "https://images.example/obverse.webp",
                    createdAt: "2026-09-16T10:30:00.000Z",
                    updatedAt: "2026-09-16T10:45:00.000Z",
                    engravers: [],
                  },
                })
              : coinListJsonResponse([
                  {
                    ...coin,
                    obverseImageUrl: "https://images.example/obverse.webp",
                    reverseImageUrl: "https://images.example/reverse.webp",
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
    expect(router.state.location.pathname).toBe(`/coins/${coinId}`)
    expect(screen.queryByText("Loading coin…")).not.toBeInTheDocument()
    expect(
      fetchMock.mock.calls.filter(([input]) =>
        String(input).endsWith(`/v1/coins/${coinId}`)
      )
    ).toHaveLength(1)
  })

  it("does not show pending feedback when Coin detail resolves quickly", async () => {
    const detailResponse = createDeferred<Response>()
    const detailRequested = createDeferred<void>()
    const fetchMock = vi.fn((input: string | URL | Request) => {
      const url = String(input)

      if (url.endsWith(`/v1/coins/${coinId}`)) {
        detailRequested.resolve()
        return detailResponse.promise
      }

      return Promise.resolve(
        url.endsWith("/v1/issuers")
          ? jsonResponse({ issuers })
          : url.endsWith("/v1/engravers")
            ? jsonResponse({ engravers })
            : coinListJsonResponse([coin])
      )
    })
    vi.stubGlobal("fetch", fetchMock)
    const router = renderArchiveRoute()
    const coinLink = await screen.findByRole("link", { name: "First coin" })
    router.options.context.queryClient.removeQueries({
      queryKey: ["coins", "detail", coinId],
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

        if (url.endsWith(`/v1/coins/${coinId}`)) {
          detailRequested.resolve()
          return detailResponse.promise
        }

        return Promise.resolve(
          url.endsWith("/v1/issuers")
            ? jsonResponse({ issuers })
            : url.endsWith("/v1/engravers")
              ? jsonResponse({ engravers })
              : coinListJsonResponse([coin])
        )
      })
    )
    const router = renderArchiveRoute()
    const coinLink = await screen.findByRole("link", { name: "First coin" })
    router.options.context.queryClient.removeQueries({
      queryKey: ["coins", "detail", coinId],
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
          : url.endsWith("/v1/engravers")
            ? jsonResponse({ engravers })
            : url.endsWith(`/v1/coins/${coinId}`)
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
        String(input).endsWith(`/v1/coins/${coinId}`)
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
    expect(engraverListQueryOptions().staleTime).toBe(Infinity)
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
