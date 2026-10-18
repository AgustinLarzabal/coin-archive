import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { expect, it, vi } from "vitest"

import {
  coinListJsonResponse,
  createArchiveFetch,
  renderArchiveRoute,
} from "@/test/archive-route-test"
import { coinListItemFixture } from "@/test/coin-fixtures"

const currencies = [
  { slug: "euro", name: "Euro", fullName: "Euro (1999–present)" },
]

it("disables Amount until Currency is selected and normalizes ambiguous URL state", async () => {
  const fetchMock = vi.fn(
    createArchiveFetch({ issuers: [{ code: "AR", name: "Argentina" }] })
  )
  vi.stubGlobal("fetch", fetchMock)
  const router = renderArchiveRoute("/?issuer=AR&amount=1", [], currencies)

  const amount = await screen.findByRole("textbox", { name: "Amount" })
  expect(amount).toBeDisabled()
  expect(amount).toHaveValue("")
  expect(router.state.location.search).toEqual({
    amount: undefined,
    issuer: "AR",
  })
  expect(fetchMock).toHaveBeenCalledWith(
    "http://localhost:3001/v1/coins?issuer=AR&page=1&pageSize=24"
  )
})

it("applies Amount with Currency, preserves other filters, and resets pagination", async () => {
  const fetchMock = vi.fn(
    createArchiveFetch({
      currencies,
      issuers: [{ code: "AR", name: "Argentina" }],
      pagination: { page: 3, pageSize: 24, totalItems: 49, totalPages: 3 },
    })
  )
  vi.stubGlobal("fetch", fetchMock)
  const router = renderArchiveRoute(
    "/?currency=euro&amount=1&issuer=AR&page=3",
    [],
    currencies
  )

  const amount = await screen.findByRole("textbox", { name: "Amount" })
  const user = userEvent.setup()
  expect(amount).toBeEnabled()
  expect(amount).toHaveValue("1")
  await user.clear(amount)
  await user.type(amount, "0.5")
  await user.click(screen.getByRole("button", { name: "Apply Amount" }))

  await waitFor(() =>
    expect(router.state.location.search).toEqual({
      amount: "0.5",
      currency: "euro",
      issuer: "AR",
    })
  )
  expect(fetchMock).toHaveBeenCalledWith(
    "http://localhost:3001/v1/coins?issuer=AR&currency=euro&amount=0.5&page=1&pageSize=24"
  )
})

it("clearing Currency and Back and Forward restore distinct filter results", async () => {
  const referenceFetch = createArchiveFetch()
  const filteredCoin = coinListItemFixture({ title: "One-euro coin" })
  const unfilteredCoin = coinListItemFixture({
    id: "00000000-0000-4000-8000-000000000002",
    title: "Any-value coin",
  })
  const fetchMock = vi.fn((input: string | URL | Request) => {
    const url = String(input)
    if (new URL(url).pathname === "/v1/coins") {
      const coin = new URL(url).searchParams.has("amount")
        ? filteredCoin
        : unfilteredCoin
      return Promise.resolve(coinListJsonResponse([coin]))
    }
    return referenceFetch(input)
  })
  vi.stubGlobal("fetch", fetchMock)
  const router = renderArchiveRoute("/?currency=euro&amount=1", [], currencies)
  const amount = await screen.findByRole("textbox", { name: "Amount" })
  const user = userEvent.setup()
  expect(screen.getByRole("link", { name: "One-euro coin" })).toBeVisible()

  await user.click(screen.getByRole("button", { name: "Clear Currency" }))

  await waitFor(() =>
    expect(router.state.location.search.currency).toBeUndefined()
  )
  expect(router.state.location.search.amount).toBeUndefined()
  expect(amount).toBeDisabled()
  expect(amount).toHaveValue("")
  expect(
    await screen.findByRole("link", { name: "Any-value coin" })
  ).toBeVisible()

  router.history.back()
  await waitFor(() =>
    expect(router.state.location.search.currency).toBe("euro")
  )
  expect(router.state.location.search.amount).toBe("1")
  expect(amount).toBeEnabled()
  expect(amount).toHaveValue("1")
  expect(
    await screen.findByRole("link", { name: "One-euro coin" })
  ).toBeVisible()
  expect(fetchMock).toHaveBeenCalledWith(
    "http://localhost:3001/v1/coins?currency=euro&amount=1&page=1&pageSize=24"
  )

  router.history.forward()
  await waitFor(() =>
    expect(router.state.location.search.currency).toBeUndefined()
  )
  expect(router.state.location.search.amount).toBeUndefined()
  expect(amount).toBeDisabled()
  expect(amount).toHaveValue("")
  expect(
    await screen.findByRole("link", { name: "Any-value coin" })
  ).toBeVisible()
})

it.each(["0.000000000001", "100000000000000001", "999999999999999999"])(
  "preserves the exact valid Amount %s from the URL",
  async (amountValue) => {
    const fetchMock = vi.fn(createArchiveFetch({ currencies }))
    vi.stubGlobal("fetch", fetchMock)
    const router = renderArchiveRoute(
      `/?currency=euro&amount=${amountValue}`,
      [],
      currencies
    )

    expect(await screen.findByRole("textbox", { name: "Amount" })).toHaveValue(
      amountValue
    )
    expect(router.state.location.search.amount).toBe(amountValue)
    expect(fetchMock).toHaveBeenCalledWith(
      `http://localhost:3001/v1/coins?currency=euro&amount=${amountValue}&page=1&pageSize=24`
    )
  }
)

it.each(["1.0", "0.0000000000001", "1e-12"])(
  "normalizes the invalid Amount %s while preserving Currency",
  async (amountValue) => {
    const fetchMock = vi.fn(createArchiveFetch({ currencies }))
    vi.stubGlobal("fetch", fetchMock)
    const router = renderArchiveRoute(
      `/?currency=euro&amount=${amountValue}`,
      [],
      currencies
    )

    expect(await screen.findByRole("textbox", { name: "Amount" })).toHaveValue(
      ""
    )
    expect(router.state.location.search).toEqual({
      amount: undefined,
      currency: "euro",
    })
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/v1/coins?currency=euro&page=1&pageSize=24"
    )
  }
)

it("shows the filtered empty state for a valid Currency and Amount", async () => {
  vi.stubGlobal("fetch", vi.fn(createArchiveFetch({ currencies })))
  renderArchiveRoute("/?currency=euro&amount=1", [], currencies)

  expect(
    await screen.findByText("No coins match the selected filters.")
  ).toBeVisible()
})
