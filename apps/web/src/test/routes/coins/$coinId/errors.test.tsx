import { screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { coinDetailFixture } from "@/test/coin-fixtures"
import {
  coinId,
  jsonResponse,
  renderCoinRoute,
} from "@/test/coin-route-test"

describe("Coin viewer route errors", () => {
  it("shows loading feedback while Coin data is pending", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {}))
    )

    renderCoinRoute()

    expect(await screen.findByText("Loading coin…")).toBeInTheDocument()
  })

  it("rejects an invalid route identifier without an HTTP request", async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)

    renderCoinRoute("not-a-uuid")

    expect(
      await screen.findByText("Invalid coin identifier")
    ).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("distinguishes a missing Coin", async () => {
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

    const router = renderCoinRoute()

    expect(await screen.findByText("Coin not found")).toBeInTheDocument()
    expect(
      router.state.matches.find((match) => match.routeId === "/coins/$coinId")
        ?.status
    ).toBe("notFound")
  })

  it.each([
    [
      "a JSON response with an unrelated error code",
      () =>
        jsonResponse(
          { error: { code: "not_found", message: "Coin not found" } },
          404
        ),
    ],
    ["an incomplete JSON response", () => jsonResponse({ error: {} }, 404)],
    ["a non-JSON response", () => new Response("Not found", { status: 404 })],
  ])("rejects %s", async (_description, createResponse) => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(createResponse()))
    )

    const router = renderCoinRoute()

    expect(await screen.findByText("Invalid coin response")).toBeInTheDocument()
    expect(screen.queryByText("Coin not found")).not.toBeInTheDocument()
    expect(
      router.state.matches.find((match) => match.routeId === "/coins/$coinId")
        ?.status
    ).not.toBe("notFound")
  })

  it("distinguishes malformed success data", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(jsonResponse({ id: coinId })))
    )

    renderCoinRoute()

    expect(await screen.findByText("Invalid coin response")).toBeInTheDocument()
  })

  it("rejects a Coin detail response without Coin Distribution", async () => {
    const { distribution: _distribution, ...coinWithoutDistribution } =
      coinDetailFixture()
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(jsonResponse(coinWithoutDistribution)))
    )

    renderCoinRoute()

    expect(await screen.findByText("Invalid coin response")).toBeInTheDocument()
  })

  it("distinguishes network and server failures", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")))

    renderCoinRoute()

    expect(await screen.findByText("Unable to load coin")).toBeInTheDocument()
  })
})
