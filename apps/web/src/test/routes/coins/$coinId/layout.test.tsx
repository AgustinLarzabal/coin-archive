import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import {
  coinDetailFixture,
  coinSurfaceWithEngraversFixture,
} from "@/test/coin-fixtures"
import {
  coinId,
  jsonResponse,
  renderCoinRoute,
} from "@/test/coin-route-test"

describe("Coin viewer route layout", () => {
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
    expect(screen.getByText("Issue Period")).toBeInTheDocument()
    expect(screen.getByText("2004")).toBeInTheDocument()
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
})
