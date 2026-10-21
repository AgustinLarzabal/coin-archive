import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import { expect, it, vi } from "vitest"

import {
  coinListJsonResponse,
  createArchiveFetch,
  renderArchiveRoute,
} from "@/test/archive-route-test"
import { coinListItemFixture } from "@/test/coin-fixtures"

it("selects a new Distribution from the catalogue and keeps it after navigation", async () => {
  const fallbackFetch = createArchiveFetch()
  const fetchMock = vi.fn((input: string | URL | Request) =>
    String(input).includes("/v1/coins?distribution=unused-pattern")
      ? Promise.resolve(
          coinListJsonResponse([
            coinListItemFixture({
              title: "Pattern Coin",
              distribution: "unused-pattern",
            }),
          ])
        )
      : fallbackFetch(input)
  )
  vi.stubGlobal("fetch", fetchMock)
  const router = renderArchiveRoute(
    "/",
    [],
    [],
    [{ slug: "unused-pattern", name: "Pattern" }]
  )
  const combobox = await screen.findByRole("combobox", { name: "Distribution" })
  const control = combobox.parentElement
  if (!control) throw new Error("Distribution combobox control not found")
  fireEvent.click(
    within(control).getByRole("button", { name: "Toggle options" })
  )
  fireEvent.click(screen.getByRole("option", { name: "Pattern" }), {
    detail: 0,
  })

  await waitFor(() =>
    expect(router.state.location.search).toEqual({
      distribution: "unused-pattern",
    })
  )
  expect(fetchMock).toHaveBeenCalledWith(
    "http://localhost:3001/v1/coins?distribution=unused-pattern&page=1&pageSize=24"
  )
  expect(await screen.findByText("Pattern Coin")).toBeVisible()
})

it("restores a new Distribution from a fresh URL load", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      createArchiveFetch({
        coins: [
          coinListItemFixture({
            title: "Pattern Coin",
            distribution: "unused-pattern",
          }),
        ],
      })
    )
  )
  const router = renderArchiveRoute(
    "/?distribution=unused-pattern",
    [],
    [],
    [{ slug: "unused-pattern", name: "Pattern" }]
  )

  expect(await screen.findByText("Pattern Coin")).toBeVisible()
  expect(screen.getByRole("combobox", { name: "Distribution" })).toHaveValue(
    "Pattern"
  )
  expect(router.state.location.search).toEqual({
    distribution: "unused-pattern",
  })
})

it("keeps a well-formed Distribution Slug absent from the catalogue", async () => {
  const fetchMock = vi.fn(createArchiveFetch())
  vi.stubGlobal("fetch", fetchMock)
  const router = renderArchiveRoute("/?distribution=unknown-pattern")
  expect(
    await screen.findByRole("combobox", { name: "Distribution" })
  ).toHaveValue("Unknown Distribution (unknown-pattern)")
  await waitFor(() =>
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/v1/coins?distribution=unknown-pattern&page=1&pageSize=24"
    )
  )
  expect(router.state.location.search).toEqual({
    distribution: "unknown-pattern",
  })
  expect(
    await screen.findByText("No coins match the selected filters.")
  ).toBeVisible()
})
