import { createMemoryHistory, RouterProvider } from "@tanstack/react-router"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { getRouter } from "@/router"
import {
  coinDetailFixture,
  coinSurfaceWithEngraversFixture,
} from "@/test/coin-fixtures"

const coinId = "00000000-0000-4000-8000-000000000001"

function renderCoinRoute(id = coinId) {
  const history = createMemoryHistory({ initialEntries: [`/coins/${id}`] })
  const router = getRouter({ history })
  render(<RouterProvider router={router} />)
  return router
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
    status,
  })
}

describe("Coin viewer route", () => {
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
    expect(router.state.statusCode).toBe(404)
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
    expect(router.state.statusCode).not.toBe(404)
  })

  it("distinguishes malformed success data", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(jsonResponse({ id: coinId })))
    )

    renderCoinRoute()

    expect(await screen.findByText("Invalid coin response")).toBeInTheDocument()
  })

  it("distinguishes network and server failures", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")))

    renderCoinRoute()

    expect(await screen.findByText("Unable to load coin")).toBeInTheDocument()
  })

  it("renders one responsive Coin viewer tree", async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          jsonResponse(
            coinDetailFixture({
              obverse: coinSurfaceWithEngraversFixture({
                description: "A portrait of the sovereign",
                imageUrl: "https://images.example/first-obverse.webp",
                createdAt: "2026-09-16T10:30:00.000Z",
                updatedAt: "2026-09-16T10:45:00.000Z",
              }),
            })
          )
        )
      )
    )

    renderCoinRoute()

    expect(
      await screen.findAllByRole("tab", { name: "Obverse", hidden: true })
    ).toHaveLength(1)

    await user.click(screen.getByRole("button", { name: "Details" }))

    expect(
      screen.getAllByRole("heading", { name: "First coin", hidden: true })
    ).toHaveLength(1)
  })

  it("switches between the mobile Coin viewer panels", async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(jsonResponse(coinDetailFixture())))
    )

    renderCoinRoute()

    const previewToggle = await screen.findByRole("button", { name: "Preview" })
    const detailsToggle = screen.getByRole("button", { name: "Details" })

    expect(previewToggle).toHaveAttribute("aria-pressed", "true")
    expect(detailsToggle).toHaveAttribute("aria-pressed", "false")

    detailsToggle.focus()
    await user.keyboard("{Enter}")

    expect(previewToggle).toHaveAttribute("aria-pressed", "false")
    expect(detailsToggle).toHaveAttribute("aria-pressed", "true")

    previewToggle.focus()
    await user.keyboard(" ")

    expect(previewToggle).toHaveAttribute("aria-pressed", "true")
    expect(detailsToggle).toHaveAttribute("aria-pressed", "false")
  })

  it("renders persisted Coin data", async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        jsonResponse(
          coinDetailFixture({
            obverse: coinSurfaceWithEngraversFixture({
              description: "A portrait of the sovereign",
              imageUrl: "https://images.example/first-obverse.webp",
              createdAt: "2026-09-16T10:30:00.000Z",
              updatedAt: "2026-09-16T10:45:00.000Z",
            }),
            reverse: coinSurfaceWithEngraversFixture({
              description: "The national coat of arms",
              imageUrl: "https://images.example/first-reverse.webp",
              createdAt: "2026-09-16T10:31:00.000Z",
              updatedAt: "2026-09-16T10:46:00.000Z",
            }),
            edge: {
              description: "A lettered inscription",
              imageUrl: "https://images.example/first-edge.webp",
              createdAt: "2026-09-16T10:32:00.000Z",
              updatedAt: "2026-09-16T10:47:00.000Z",
            },
          })
        )
      )
    )
    vi.stubGlobal("fetch", fetchMock)

    renderCoinRoute()

    expect(
      await screen.findByRole("heading", { name: "First coin" })
    ).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "First coin" })).toHaveAttribute(
      "aria-current",
      "page"
    )
    expect(screen.getByText("Argentina")).toBeInTheDocument()
    expect(screen.queryByText("Issuer")).not.toBeInTheDocument()
    expect(screen.getByText("A portrait of the sovereign")).toBeInTheDocument()
    expect(
      screen.getByRole("img", { name: "Obverse of First coin" })
    ).toHaveAttribute("src", "https://images.example/first-obverse.webp")
    await user.click(screen.getByRole("tab", { name: "Reverse" }))
    expect(screen.getByText("The national coat of arms")).toBeVisible()
    expect(
      screen.getByRole("img", { name: "Reverse of First coin" })
    ).toHaveAttribute("src", "https://images.example/first-reverse.webp")
    await user.click(screen.getByRole("tab", { name: "Edge" }))
    expect(screen.getByText("A lettered inscription")).toBeVisible()
    expect(
      screen.getByRole("img", { name: "Edge of First coin" })
    ).toHaveAttribute("src", "https://images.example/first-edge.webp")
    expect(screen.queryByText(/Lorem ipsum/i)).not.toBeInTheDocument()
    const flag = screen.getByAltText("")
    expect(flag).toHaveAttribute("src", expect.stringMatching(/\/ar\.svg$/))
    expect(flag).toHaveAttribute("aria-hidden", "true")
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(
      `http://localhost:3001/v1/coins/${coinId}`
    )
  })

  it("renders ordered Engraver names within their corresponding Obverse and Reverse tabs", async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          jsonResponse(
            coinDetailFixture({
              title: "Credited coin",
              obverse: {
                description: "Portrait",
                imageUrl: null,
                createdAt: "2026-09-16T10:30:00.000Z",
                updatedAt: "2026-09-16T10:45:00.000Z",
                engravers: [
                  {
                    slug: "second-engraver",
                    fullName: "Second Engraver",
                    createdAt: "2026-09-10T10:00:00.000Z",
                    updatedAt: "2026-09-11T10:00:00.000Z",
                  },
                  {
                    slug: "first-engraver",
                    fullName: "First Engraver",
                    createdAt: "2026-09-08T10:00:00.000Z",
                    updatedAt: "2026-09-09T10:00:00.000Z",
                  },
                ],
              },
              reverse: {
                description: "Arms",
                imageUrl: null,
                createdAt: "2026-09-16T10:31:00.000Z",
                updatedAt: "2026-09-16T10:46:00.000Z",
                engravers: [
                  {
                    slug: "reverse-engraver",
                    fullName: "Reverse Engraver",
                    createdAt: "2026-09-12T10:00:00.000Z",
                    updatedAt: "2026-09-13T10:00:00.000Z",
                  },
                ],
              },
            })
          )
        )
      )
    )

    renderCoinRoute()

    expect(await screen.findByText("Second Engraver")).toBeVisible()
    expect(screen.getByText("First Engraver")).toBeVisible()
    expect(screen.queryByText("Reverse Engraver")).not.toBeInTheDocument()

    await user.click(screen.getByRole("tab", { name: "Reverse" }))

    expect(screen.getByText("Reverse Engraver")).toBeVisible()
    expect(screen.queryByText("Second Engraver")).not.toBeInTheDocument()
  })

  it("renders honest missing-data states for empty Coin Surfaces", async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(jsonResponse(coinDetailFixture())))
    )

    renderCoinRoute()

    expect(await screen.findByText("Obverse image unavailable")).toBeVisible()
    expect(screen.getByText("Obverse description unavailable")).toBeVisible()
    expect(
      screen.queryByRole("img", { name: "Obverse of First coin" })
    ).not.toBeInTheDocument()
    await user.click(screen.getByRole("tab", { name: "Reverse" }))
    expect(screen.getByText("Reverse image unavailable")).toBeVisible()
    expect(screen.getByText("Reverse description unavailable")).toBeVisible()
    expect(
      screen.queryByRole("img", { name: "Reverse of First coin" })
    ).not.toBeInTheDocument()
    expect(screen.queryByRole("tab", { name: "Edge" })).not.toBeInTheDocument()
  })

  it.each([
    [
      "description",
      {
        description: "A lettered inscription",
        imageUrl: null,
        createdAt: "2026-09-16T10:32:00.000Z",
        updatedAt: "2026-09-16T10:47:00.000Z",
      },
    ],
    [
      "image",
      {
        description: null,
        imageUrl: "https://images.example/first-edge.webp",
        createdAt: "2026-09-16T10:32:00.000Z",
        updatedAt: "2026-09-16T10:47:00.000Z",
      },
    ],
  ])("shows Edge when only its %s exists", async (_content, edge) => {
    const user = userEvent.setup()
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          jsonResponse(
            coinDetailFixture({
              edge,
            })
          )
        )
      )
    )

    renderCoinRoute()

    await user.click(await screen.findByRole("tab", { name: "Edge" }))
    if (edge.description) {
      expect(screen.getByText(edge.description)).toBeVisible()
      expect(screen.getByText("Edge image unavailable")).toBeVisible()
    } else {
      expect(screen.getByText("Edge description unavailable")).toBeVisible()
      expect(
        screen.getByRole("img", { name: "Edge of First coin" })
      ).toHaveAttribute("src", edge.imageUrl)
    }
  })

  it("renders a partial Reverse with its missing-image state", async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          jsonResponse(
            coinDetailFixture({
              reverse: coinSurfaceWithEngraversFixture({
                description: "The national coat of arms",
                imageUrl: null,
                createdAt: "2026-09-16T10:31:00.000Z",
                updatedAt: "2026-09-16T10:46:00.000Z",
              }),
            })
          )
        )
      )
    )

    renderCoinRoute()

    await user.click(await screen.findByRole("tab", { name: "Reverse" }))
    expect(screen.getByText("The national coat of arms")).toBeVisible()
    expect(screen.getByText("Reverse image unavailable")).toBeVisible()
  })

  it("renders an Archive-defined Issuer without a flag or visible Issuer Code", async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        jsonResponse(
          coinDetailFixture({
            title: "Roman coin",
            issuer: { name: "Roman Empire", code: "ROMAN" },
          })
        )
      )
    )
    vi.stubGlobal("fetch", fetchMock)

    renderCoinRoute()

    expect(await screen.findByText("Roman Empire")).toBeInTheDocument()
    expect(screen.queryByText("ROMAN")).not.toBeInTheDocument()
    expect(screen.queryByAltText("")).not.toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
