import { screen } from "@testing-library/react"
import { expect, it, vi } from "vitest"

import {
  createArchiveFetch,
  jsonResponse,
  renderArchiveRoute,
} from "@/test/archive-route-test"

it("uses the route error state for an invalid Currency response", async () => {
  vi.stubGlobal("fetch", vi.fn(createArchiveFetch()))
  renderArchiveRoute(
    "/",
    [],
    jsonResponse({
      currencies: [
        {
          slug: "euro",
          name: "Euro",
          fullName: "Euro (1999–present)",
          periodLabel: "private",
        },
      ],
    })
  )

  expect(
    await screen.findByText("Invalid Currency list response")
  ).toBeVisible()
  expect(
    screen.queryByRole("navigation", { name: "Explore filters" })
  ).toBeNull()
})

it("uses the route error state when the Currency request fails", async () => {
  vi.stubGlobal("fetch", vi.fn(createArchiveFetch()))
  renderArchiveRoute("/", [], new Response(null, { status: 503 }))

  expect(await screen.findByText("Unable to load Currencies")).toBeVisible()
  expect(
    screen.queryByRole("navigation", { name: "Explore filters" })
  ).toBeNull()
})
