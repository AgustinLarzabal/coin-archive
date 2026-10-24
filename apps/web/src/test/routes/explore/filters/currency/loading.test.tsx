import { screen } from "@testing-library/react"
import { expect, it, vi } from "vitest"

import {
  createArchiveFetch,
  jsonResponse,
  renderArchiveRoute,
} from "@/test/archive-route-test"

it("keeps Explore loading until Currency reference data is ready", async () => {
  let resolveCurrencies: ((response: Response) => void) | undefined
  const currenciesResponse = new Promise<Response>((resolve) => {
    resolveCurrencies = resolve
  })
  vi.stubGlobal("fetch", vi.fn(createArchiveFetch()))
  renderArchiveRoute("/", [], currenciesResponse)

  expect(await screen.findByText("Loading coins…")).toBeVisible()
  expect(
    screen.queryByRole("navigation", { name: "ReUI filter experiment" })
  ).toBeNull()

  resolveCurrencies?.(jsonResponse({ currencies: [] }))
  expect(
    await screen.findByRole("navigation", { name: "ReUI filter experiment" })
  ).toBeVisible()
})
