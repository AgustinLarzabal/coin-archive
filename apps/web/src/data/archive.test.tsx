import { QueryClient } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import {
  coinDetailQueryOptions,
  coinListQueryOptions,
  InvalidCoinIdError,
  InvalidCoinListResponseError,
  InvalidCoinResponseError,
  InvalidIssuerListResponseError,
  IssuerListRequestError,
} from "./archive"
import { InvalidCoinListFilterError } from "./archive/coins"
import { Route as ExploreRoute } from "@/routes/_explore"
import { Route as ExploreIndexRoute } from "@/routes/_explore.index"
import { Route as CoinRoute } from "@/routes/coins.$coinId"
import { startInstance } from "@/start"
import { coinListJsonResponse, jsonResponse } from "@/test/archive-route-test"
import { coinDetailFixture, coinFaceValueFixture } from "@/test/coin-fixtures"

const coinId = "00000000-0000-4000-8000-000000000001"
const coin = {
  id: coinId,
  title: "First coin",
  distribution: "circulating-commemorative" as const,
  firstIssueYear: 2004,
  lastIssueYear: 2004,
  issuer: { name: "Argentina", code: "AR" },
  faceValue: null,
  createdAt: "2026-09-16T10:00:00.000Z",
  updatedAt: "2026-09-16T11:00:00.000Z",
}

function coinResponse(issuer: { code: string; name: string; id?: string }) {
  return jsonResponse(coinDetailFixture({ ...coin, issuer }))
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
}

describe("Archive data module", () => {
  it("reuses the Coin list cache for omitted and undefined filters", async () => {
    const fetchMock = vi.fn(() => Promise.resolve(coinListJsonResponse([])))
    vi.stubGlobal("fetch", fetchMock)
    const queryClient = createQueryClient()

    expect(coinListQueryOptions().queryKey[2]).toStrictEqual({
      page: 1,
    })
    await queryClient.fetchQuery(coinListQueryOptions())
    await queryClient.fetchQuery(
      coinListQueryOptions({ page: 1, currencySlug: undefined })
    )

    expect(fetchMock).toHaveBeenCalledOnce()
    queryClient.clear()
  })

  it.each([
    [{ issuerCode: "bad!" }, "Invalid issuer Code"],
    [{ faceValueAmount: "1" }, "Invalid Face Value Amount"],
    [{ page: 0 }, "Invalid Coin List Page"],
    [{ issueYear: 0 }, "Invalid Issue Year"],
  ])("reports invalid Coin list filters", (filters, message) => {
    expect(() => coinListQueryOptions(filters)).toThrowError(
      InvalidCoinListFilterError
    )
    expect(() => coinListQueryOptions(filters)).toThrowError(message)
  })

  it("reports the first invalid filter and checks page last", () => {
    expect(() =>
      coinListQueryOptions({ composition: "BAD!", currencySlug: "BAD!" })
    ).toThrowError("Invalid Coin Composition")
    expect(() =>
      coinListQueryOptions({ weight: "8.5-8.125", page: 0 })
    ).toThrowError("Invalid Coin Weight")
  })

  it("maps a selected Coin Distribution to the Coin list request", async () => {
    const fetchMock = vi.fn(() => Promise.resolve(coinListJsonResponse([])))
    vi.stubGlobal("fetch", fetchMock)
    const queryClient = createQueryClient()

    await queryClient.fetchQuery(
      coinListQueryOptions({ distribution: "non-circulating" })
    )

    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
      "http://localhost:3001/v1/coins?distribution=non-circulating&page=1&pageSize=24"
    )
    queryClient.clear()
  })

  it("sends an inclusive Coin Size range as one query value", async () => {
    const fetchMock = vi.fn(() => Promise.resolve(coinListJsonResponse([])))
    vi.stubGlobal("fetch", fetchMock)
    const queryClient = createQueryClient()

    await queryClient.fetchQuery(coinListQueryOptions({ size: "20-25.75" }))

    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
      "http://localhost:3001/v1/coins?size=20-25.75&page=1&pageSize=24"
    )
    expect(() => coinListQueryOptions({ size: "30-20" })).toThrow(
      "Invalid Coin Size"
    )
    queryClient.clear()
  })

  it("sends an inclusive Coin Thickness range as one query value", async () => {
    const fetchMock = vi.fn(() => Promise.resolve(coinListJsonResponse([])))
    vi.stubGlobal("fetch", fetchMock)
    const queryClient = createQueryClient()

    await queryClient.fetchQuery(
      coinListQueryOptions({ thickness: "1.5-2.25" })
    )

    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
      "http://localhost:3001/v1/coins?thickness=1.5-2.25&page=1&pageSize=24"
    )
    expect(() => coinListQueryOptions({ thickness: "2.25-1.5" })).toThrow(
      "Invalid Coin Thickness"
    )
    queryClient.clear()
  })

  it("sends an inclusive Coin Weight range as one query value", async () => {
    const fetchMock = vi.fn(() => Promise.resolve(coinListJsonResponse([])))
    vi.stubGlobal("fetch", fetchMock)
    const queryClient = createQueryClient()

    await queryClient.fetchQuery(coinListQueryOptions({ weight: "8.125-8.5" }))

    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
      "http://localhost:3001/v1/coins?weight=8.125-8.5&page=1&pageSize=24"
    )
    expect(() => coinListQueryOptions({ weight: "8.5-8.125" })).toThrow(
      "Invalid Coin Weight"
    )
    queryClient.clear()
  })

  it("sends selected filters and pagination to the Coin API", async () => {
    const fetchMock = vi.fn(() => Promise.resolve(coinListJsonResponse([])))
    vi.stubGlobal("fetch", fetchMock)
    const queryClient = createQueryClient()

    await queryClient.fetchQuery(
      coinListQueryOptions({
        currencySlug: "euro",
        faceValueAmount: "0.5",
        distribution: "non-circulating",
        engraverSlug: "first-engraver",
        issuerCode: "AR",
        issueYear: 1986,
        page: 3,
        rulingAuthoritySlug: "selected-authority",
      })
    )

    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
      "http://localhost:3001/v1/coins?currency=euro&distribution=non-circulating&engraver=first-engraver&amount=0.5&issuer=AR&year=1986&ruler=selected-authority&page=3&pageSize=24"
    )
    queryClient.clear()
  })

  it("accepts both surface images in a Coin list response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          coinListJsonResponse([
            {
              ...coin,
              obverseImageUrl: "https://images.example/obverse.webp",
              reverseImageUrl: null,
            },
          ])
        )
      )
    )
    const queryClient = createQueryClient()

    await expect(
      queryClient.fetchQuery(coinListQueryOptions())
    ).resolves.toEqual({
      coins: [
        {
          ...coin,
          obverseImageUrl: "https://images.example/obverse.webp",
          reverseImageUrl: null,
        },
      ],
      pagination: {
        page: 1,
        pageSize: 24,
        totalItems: 1,
        totalPages: 1,
      },
    })
    queryClient.clear()
  })

  it("accepts populated and null Face Values in a Coin list response", async () => {
    const populatedFaceValue = coinFaceValueFixture()
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          coinListJsonResponse([
            {
              ...coin,
              faceValue: populatedFaceValue,
              obverseImageUrl: null,
              reverseImageUrl: null,
            },
            {
              ...coin,
              id: "00000000-0000-4000-8000-000000000002",
              faceValue: null,
              obverseImageUrl: null,
              reverseImageUrl: null,
            },
          ])
        )
      )
    )
    const queryClient = createQueryClient()

    await expect(
      queryClient.fetchQuery(coinListQueryOptions())
    ).resolves.toEqual(
      expect.objectContaining({
        coins: [
          expect.objectContaining({ faceValue: populatedFaceValue }),
          expect.objectContaining({ faceValue: null }),
        ],
      })
    )
    queryClient.clear()
  })

  it("rejects a malformed Face Value in a Coin list response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          coinListJsonResponse([
            {
              ...coin,
              faceValue: {
                label: "1 peso",
                numericValue: 1,
                currency: {
                  slug: "argentine-peso-convertible",
                  name: "Peso",
                },
              },
              obverseImageUrl: null,
              reverseImageUrl: null,
            },
          ])
        )
      )
    )
    const queryClient = createQueryClient()

    await expect(
      queryClient.fetchQuery(coinListQueryOptions())
    ).rejects.toBeInstanceOf(InvalidCoinListResponseError)
    queryClient.clear()
  })

  it("rejects a Coin list response without pagination metadata", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              coins: [
                {
                  ...coin,
                  obverseImageUrl: null,
                  reverseImageUrl: null,
                },
              ],
            }),
            { headers: { "content-type": "application/json" } }
          )
        )
      )
    )
    const queryClient = createQueryClient()

    await expect(
      queryClient.fetchQuery(coinListQueryOptions())
    ).rejects.toBeInstanceOf(InvalidCoinListResponseError)
    queryClient.clear()
  })

  it("rejects the legacy Coin list response without surface image fields", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(coinListJsonResponse([coin])))
    )
    const queryClient = createQueryClient()

    await expect(
      queryClient.fetchQuery(coinListQueryOptions())
    ).rejects.toBeInstanceOf(InvalidCoinListResponseError)
    queryClient.clear()
  })

  it.each(["distribution", "firstIssueYear", "lastIssueYear"] as const)(
    "rejects a legacy Coin list response without %s",
    async (endpoint) => {
      const legacyCoin = { ...coin, [endpoint]: undefined }
      vi.stubGlobal(
        "fetch",
        vi.fn(() =>
          Promise.resolve(
            coinListJsonResponse([
              {
                ...legacyCoin,
                obverseImageUrl: null,
                reverseImageUrl: null,
              },
            ])
          )
        )
      )
      const queryClient = createQueryClient()

      await expect(
        queryClient.fetchQuery(coinListQueryOptions())
      ).rejects.toBeInstanceOf(InvalidCoinListResponseError)
      queryClient.clear()
    }
  )

  it.each([
    [0, 2004],
    [2004, 0],
    [2005, 2004],
  ])(
    "rejects a Coin list response with the invalid Issue Period %i–%i",
    async (firstIssueYear, lastIssueYear) => {
      vi.stubGlobal(
        "fetch",
        vi.fn(() =>
          Promise.resolve(
            coinListJsonResponse([
              {
                ...coin,
                firstIssueYear,
                lastIssueYear,
                obverseImageUrl: null,
                reverseImageUrl: null,
              },
            ])
          )
        )
      )
      const queryClient = createQueryClient()

      await expect(
        queryClient.fetchQuery(coinListQueryOptions())
      ).rejects.toBeInstanceOf(InvalidCoinListResponseError)
      queryClient.clear()
    }
  )

  it("accepts complete surface data in a Coin detail response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          jsonResponse({
            ...coin,
            distributionName: "Circulating commemorative",
            orientation: null,
            composition: null,
            compositionName: null,
            compositionDetail: null,
            demonetized: null,
            shape: null,
            shapeName: null,
            technique: null,
            techniqueName: null,
            size: null,
            thickness: null,
            weight: null,
            faceValue: null,
            rulers: [],
            mints: [],
            tags: [],
            obverse: {
              description: "A portrait",
              imageUrl: "https://images.example/obverse.webp",
              createdAt: "2026-09-16T10:30:00.000Z",
              updatedAt: "2026-09-16T10:45:00.000Z",
              engravers: [],
            },
            reverse: {
              description: "A coat of arms",
              imageUrl: "https://images.example/reverse.webp",
              createdAt: "2026-09-16T10:31:00.000Z",
              updatedAt: "2026-09-16T10:46:00.000Z",
              engravers: [],
            },
            edge: {
              description: "A lettered inscription",
              imageUrl: "https://images.example/edge.webp",
              createdAt: "2026-09-16T10:32:00.000Z",
              updatedAt: "2026-09-16T10:47:00.000Z",
            },
          })
        )
      )
    )
    const queryClient = createQueryClient()

    await expect(
      queryClient.fetchQuery(coinDetailQueryOptions(coinId))
    ).resolves.toEqual({
      ...coin,
      distributionName: "Circulating commemorative",
      demonetized: null,
      orientation: null,
      composition: null,
      compositionName: null,
      compositionDetail: null,
      shape: null,
      shapeName: null,
      technique: null,
      techniqueName: null,
      size: null,
      thickness: null,
      weight: null,
      faceValue: null,
      rulers: [],
      mints: [],
      tags: [],
      obverse: {
        description: "A portrait",
        imageUrl: "https://images.example/obverse.webp",
        createdAt: "2026-09-16T10:30:00.000Z",
        updatedAt: "2026-09-16T10:45:00.000Z",
        engravers: [],
      },
      reverse: {
        description: "A coat of arms",
        imageUrl: "https://images.example/reverse.webp",
        createdAt: "2026-09-16T10:31:00.000Z",
        updatedAt: "2026-09-16T10:46:00.000Z",
        engravers: [],
      },
      edge: {
        description: "A lettered inscription",
        imageUrl: "https://images.example/edge.webp",
        createdAt: "2026-09-16T10:32:00.000Z",
        updatedAt: "2026-09-16T10:47:00.000Z",
      },
    })
    queryClient.clear()
  })

  it("rejects the legacy Coin detail response without fixed surfaces", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(jsonResponse({ ...coin, faceValue: null, rulers: [] }))
      )
    )
    const queryClient = createQueryClient()

    await expect(
      queryClient.fetchQuery(coinDetailQueryOptions(coinId))
    ).rejects.toBeInstanceOf(InvalidCoinResponseError)
    queryClient.clear()
  })

  it.each([
    "distribution",
    "firstIssueYear",
    "lastIssueYear",
    "faceValue",
  ] as const)(
    "rejects a legacy Coin detail response without %s",
    async (endpoint) => {
      vi.stubGlobal(
        "fetch",
        vi.fn(() =>
          Promise.resolve(
            jsonResponse({ ...coinDetailFixture(), [endpoint]: undefined })
          )
        )
      )
      const queryClient = createQueryClient()

      await expect(
        queryClient.fetchQuery(coinDetailQueryOptions(coinId))
      ).rejects.toBeInstanceOf(InvalidCoinResponseError)
      queryClient.clear()
    }
  )

  it.each([
    [0, 2004],
    [2004, 0],
    [2005, 2004],
  ])(
    "rejects a Coin detail response with the invalid Issue Period %i–%i",
    async (firstIssueYear, lastIssueYear) => {
      vi.stubGlobal(
        "fetch",
        vi.fn(() =>
          Promise.resolve(
            jsonResponse(coinDetailFixture({ firstIssueYear, lastIssueYear }))
          )
        )
      )
      const queryClient = createQueryClient()

      await expect(
        queryClient.fetchQuery(coinDetailQueryOptions(coinId))
      ).rejects.toBeInstanceOf(InvalidCoinResponseError)
      queryClient.clear()
    }
  )

  it.each([
    ["ISO", { name: "Argentina", code: "AR" }],
    ["Archive-defined", { name: "Roman Empire", code: "ROMAN" }],
  ])("accepts an %s Issuer Code", async (_category, issuer) => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(coinResponse(issuer)))
    )
    const queryClient = createQueryClient()

    await expect(
      queryClient.fetchQuery(coinDetailQueryOptions(coinId))
    ).resolves.toEqual(expect.objectContaining({ issuer }))
    queryClient.clear()
  })

  it("rejects an exposed Issuer UUID", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          coinResponse({
            id: "10000000-0000-4000-8000-000000000001",
            name: "Roman Empire",
            code: "ROMAN",
          })
        )
      )
    )
    const queryClient = createQueryClient()

    await expect(
      queryClient.fetchQuery(coinDetailQueryOptions(coinId))
    ).rejects.toBeInstanceOf(InvalidCoinResponseError)
    queryClient.clear()
  })

  it.each([
    {
      ErrorType: InvalidCoinIdError,
      route: CoinRoute,
      message: "Invalid coin identifier",
    },
    {
      ErrorType: InvalidCoinResponseError,
      route: CoinRoute,
      message: "Invalid coin response",
    },
    {
      ErrorType: InvalidCoinListResponseError,
      route: ExploreIndexRoute,
      message: "Invalid coin list response",
    },
    {
      ErrorType: InvalidIssuerListResponseError,
      route: ExploreRoute,
      message: "Invalid issuer list response",
    },
    {
      ErrorType: IssuerListRequestError,
      route: ExploreRoute,
      message: "Issuer list request failed",
      renderedMessage: "Unable to load issuers",
    },
  ])(
    "preserves '$message' after SSR serialization",
    async ({ ErrorType, route, message, renderedMessage }) => {
      const original = new ErrorType(message, {
        cause: new Error("Internal response details"),
      })
      const { serializationAdapters: adapters } =
        await startInstance.getOptions()
      const adapter = adapters?.find((candidate) => candidate.test(original))
      if (!adapter) throw new Error("Missing error serialization adapter")

      const payload = JSON.stringify(adapter.toSerializable(original))
      const restored = adapter.fromSerializable(JSON.parse(payload))

      expect(restored).toBeInstanceOf(ErrorType)
      expect(restored).not.toBe(original)
      expect(restored.message).toBe(message)
      expect(restored.cause).toBeUndefined()
      expect(payload).not.toContain("Internal response details")
      expect(payload).not.toContain(original.stack)

      const ErrorComponent = route.options.errorComponent
      if (!ErrorComponent) throw new Error("Missing route error component")
      render(<ErrorComponent error={restored} reset={() => {}} />)
      expect(screen.getByText(renderedMessage ?? message)).toBeInTheDocument()
    }
  )

  it("shows the generic Explore error for an unadapted filter error", async () => {
    const { serializationAdapters: adapters } = await startInstance.getOptions()
    expect(
      adapters?.some((adapter) =>
        adapter.test(new InvalidCoinListFilterError("Invalid Coin Composition"))
      )
    ).toBe(false)

    const ErrorComponent = ExploreIndexRoute.options.errorComponent
    if (!ErrorComponent) throw new Error("Missing route error component")
    render(
      <ErrorComponent
        error={new Error("Invalid Coin Composition")}
        reset={() => {}}
      />
    )
    expect(screen.getByText("Unable to load coins")).toBeInTheDocument()
  })
})
