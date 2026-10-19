import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import {
  coinDetailFixture,
  coinSurfaceWithEngraversFixture,
} from "@/test/coin-fixtures"
import { jsonResponse, renderCoinRoute } from "@/test/coin-route-test"

describe("Coin viewer route surfaces", () => {
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
})
