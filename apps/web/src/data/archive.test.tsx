import { QueryClient } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import {
  coinDetailQueryOptions,
  coinListQueryOptions,
  EngraverListRequestError,
  InvalidCoinIdError,
  InvalidCoinListResponseError,
  InvalidCoinResponseError,
  InvalidEngraverListResponseError,
  InvalidEngraverSlugError,
  InvalidIssuerCodeError,
  InvalidIssuerListResponseError,
} from "./archive"
import { Route as ExploreRoute } from "@/routes/_explore"
import { Route as ExploreIndexRoute } from "@/routes/_explore.index"
import { Route as CoinRoute } from "@/routes/coins.$coinId"
import { startInstance } from "@/start"
import { coinDetailFixture } from "@/test/coin-fixtures"

const coinId = "00000000-0000-4000-8000-000000000001"
const coin = {
  id: coinId,
  title: "First coin",
  firstIssueYear: 2004,
  lastIssueYear: 2004,
  issuer: { name: "Argentina", code: "AR" },
  createdAt: "2026-09-16T10:00:00.000Z",
  updatedAt: "2026-09-16T11:00:00.000Z",
}

function jsonResponse(body: unknown) {
  const responseBody =
    typeof body === "object" &&
    body !== null &&
    "coins" in body &&
    Array.isArray(body.coins) &&
    !("pagination" in body)
      ? {
          ...body,
          pagination: {
            page: 1,
            pageSize: 24,
            totalItems: body.coins.length,
            totalPages: body.coins.length === 0 ? 0 : 1,
          },
        }
      : body

  return new Response(JSON.stringify(responseBody), {
    headers: { "content-type": "application/json" },
  })
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
  it("accepts both surface images in a Coin list response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          jsonResponse({
            coins: [
              {
                ...coin,
                obverseImageUrl: "https://images.example/obverse.webp",
                reverseImageUrl: null,
              },
            ],
          })
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
      vi.fn(() => Promise.resolve(jsonResponse({ coins: [coin] })))
    )
    const queryClient = createQueryClient()

    await expect(
      queryClient.fetchQuery(coinListQueryOptions())
    ).rejects.toBeInstanceOf(InvalidCoinListResponseError)
    queryClient.clear()
  })

  it.each(["firstIssueYear", "lastIssueYear"] as const)(
    "rejects a legacy Coin list response without %s",
    async (endpoint) => {
      const legacyCoin = { ...coin, [endpoint]: undefined }
      vi.stubGlobal(
        "fetch",
        vi.fn(() =>
          Promise.resolve(
            jsonResponse({
              coins: [
                {
                  ...legacyCoin,
                  obverseImageUrl: null,
                  reverseImageUrl: null,
                },
              ],
            })
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
            jsonResponse({
              coins: [
                {
                  ...coin,
                  firstIssueYear,
                  lastIssueYear,
                  obverseImageUrl: null,
                  reverseImageUrl: null,
                },
              ],
            })
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
      vi.fn(() => Promise.resolve(jsonResponse(coin)))
    )
    const queryClient = createQueryClient()

    await expect(
      queryClient.fetchQuery(coinDetailQueryOptions(coinId))
    ).rejects.toBeInstanceOf(InvalidCoinResponseError)
    queryClient.clear()
  })

  it.each(["firstIssueYear", "lastIssueYear"] as const)(
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
      ErrorType: InvalidEngraverListResponseError,
      route: ExploreRoute,
      message: "Invalid engraver list response",
    },
    {
      ErrorType: EngraverListRequestError,
      route: ExploreRoute,
      message: "Engraver list request failed",
      renderedMessage: "Unable to load engravers",
    },
    {
      ErrorType: InvalidIssuerCodeError,
      route: ExploreIndexRoute,
      message: "Invalid issuer code",
      renderedMessage: "Unable to load coins",
    },
    {
      ErrorType: InvalidEngraverSlugError,
      route: ExploreIndexRoute,
      message: "Invalid engraver slug",
      renderedMessage: "Unable to load coins",
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
})
