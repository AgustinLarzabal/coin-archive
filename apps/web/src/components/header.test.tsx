import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router"
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Header } from "./header"

function renderHeader() {
  const routeTree = createRootRoute({ component: Header })
  const router = createRouter({
    history: createMemoryHistory({ initialEntries: ["/"] }),
    routeTree,
  })

  render(<RouterProvider router={router} />)
}

describe("Header", () => {
  it("links the application name to the home page", async () => {
    renderHeader()

    const heading = await screen.findByRole("heading", {
      level: 1,
      name: "Coin Archive",
    })

    expect(heading).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: "Coin Archive" })
    ).toHaveAttribute("href", "/")
  })
})
