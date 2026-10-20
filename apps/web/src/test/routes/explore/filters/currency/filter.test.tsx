import { fireEvent, screen, waitFor } from "@testing-library/react"
import { expect, it, vi } from "vitest"

import {
  coinListJsonResponse,
  createArchiveFetch,
  renderArchiveRoute,
} from "@/test/archive-route-test"
import { coinListItemFixture } from "@/test/coin-fixtures"

const currencies = [
  {
    slug: "argentine-peso-convertible",
    name: "Peso",
    fullName: "Peso (1992–2001)",
  },
  { slug: "euro", name: "Euro", fullName: "Euro (1999–present)" },
]

it("searches and selects a Currency while preserving filters and resetting pagination", async () => {
  const referenceFetch = createArchiveFetch({
    currencies,
    issuers: [{ code: "AR", name: "Argentina" }],
    pagination: {
      page: 3,
      pageSize: 24,
      totalItems: 49,
      totalPages: 3,
    },
  })
  const fetchMock = vi.fn((input: string | URL | Request) => {
    const url = new URL(String(input))
    if (url.pathname === "/v1/coins") {
      const selected = url.searchParams.has("currency")
      return Promise.resolve(
        coinListJsonResponse([
          coinListItemFixture({
            title: selected ? "Peso coin" : "Unfiltered coin",
          }),
        ])
      )
    }
    return referenceFetch(input)
  })
  vi.stubGlobal("fetch", fetchMock)
  const router = renderArchiveRoute(
    "/?issuer=AR&year=1999&page=3",
    [],
    currencies
  )
  const combobox = await screen.findByRole("combobox", { name: "Currency" })
  expect(
    await screen.findByRole("link", { name: "Unfiltered coin" })
  ).toBeVisible()

  combobox.focus()
  fireEvent.input(combobox, { target: { value: "1992" } })
  fireEvent.keyDown(combobox, { key: "ArrowDown" })
  const option = await screen.findByRole("option", {
    name: "Peso (1992–2001)",
  })
  expect(option).toHaveAttribute("data-highlighted")
  expect(combobox).toHaveAttribute("aria-activedescendant", option.id)
  fireEvent.click(option, { detail: 0 })

  await waitFor(() =>
    expect(router.state.location.search).toEqual({
      issuer: "AR",
      currency: "argentine-peso-convertible",
      year: 1999,
    })
  )
  expect(fetchMock).toHaveBeenCalledWith(
    "http://localhost:3001/v1/coins?currency=argentine-peso-convertible&issuer=AR&year=1999&page=1&pageSize=24"
  )
  expect(await screen.findByRole("link", { name: "Peso coin" })).toBeVisible()
  expect(combobox).toHaveFocus()
})
