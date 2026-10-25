import { screen, waitFor } from "@testing-library/react"
import { expect, it, vi } from "vitest"

import {
  coinListJsonResponse,
  createArchiveFetch,
  renderArchiveRoute,
} from "@/test/archive-route-test"
import { coinListItemFixture } from "@/test/coin-fixtures"

it("keeps valid measurement bounds in the URL and Coin list request", async () => {
  const fetchMock = vi.fn(createArchiveFetch())
  vi.stubGlobal("fetch", fetchMock)
  const router = renderArchiveRoute(
    "/?sizeMin=20&sizeMax=25.75&thicknessMax=2.2&weightMin=8.125"
  )

  await screen.findByRole("navigation", { name: "Explore filters" })
  expect(router.state.location.search).toMatchObject({
    sizeMin: "20",
    sizeMax: "25.75",
    thicknessMax: "2.2",
    weightMin: "8.125",
  })
  expect(fetchMock).toHaveBeenCalledWith(
    "http://localhost:3001/v1/coins?sizeMin=20&sizeMax=25.75&thicknessMax=2.2&weightMin=8.125&page=1&pageSize=24"
  )
  expect(
    await screen.findByText("No coins match the selected filters.")
  ).toBeVisible()
})

it("drops malformed and reversed bounds from Explore requests", async () => {
  const fetchMock = vi.fn(createArchiveFetch())
  vi.stubGlobal("fetch", fetchMock)
  const router = renderArchiveRoute(
    "/?sizeMin=25&sizeMax=20&weightMin=1.0001&thicknessMin=0"
  )

  await screen.findByRole("navigation", { name: "Explore filters" })
  expect(router.state.location.search).toEqual({ sizeMin: "25" })
  expect(fetchMock).toHaveBeenCalledWith(
    "http://localhost:3001/v1/coins?sizeMin=25&page=1&pageSize=24"
  )
})

it("preserves every digit of a valid large bound in the URL and request", async () => {
  const fetchMock = vi.fn(createArchiveFetch())
  vi.stubGlobal("fetch", fetchMock)
  const router = renderArchiveRoute("/?sizeMin=100000000000000001")

  await screen.findByRole("navigation", { name: "Explore filters" })
  expect(router.state.location.search.sizeMin).toBe("100000000000000001")
  expect(fetchMock).toHaveBeenCalledWith(
    "http://localhost:3001/v1/coins?sizeMin=100000000000000001&page=1&pageSize=24"
  )
})

it("restores distinct measurement results with browser Back and Forward", async () => {
  const referenceFetch = createArchiveFetch()
  const small = coinListItemFixture({ title: "Smaller coin" })
  const large = coinListItemFixture({ title: "Larger coin" })
  vi.stubGlobal("fetch", (input: string | URL | Request) => {
    const url = String(input)
    if (new URL(url).pathname === "/v1/coins") {
      return Promise.resolve(
        coinListJsonResponse([
          new URL(url).searchParams.get("sizeMin") === "25" ? large : small,
        ])
      )
    }
    return referenceFetch(input)
  })
  const router = renderArchiveRoute("/?sizeMin=20")
  expect(
    await screen.findByRole("link", { name: "Smaller coin" })
  ).toBeVisible()

  await router.navigate({ to: "/", search: { sizeMin: "25" } })
  expect(await screen.findByRole("link", { name: "Larger coin" })).toBeVisible()

  router.history.back()
  await waitFor(() => expect(router.state.location.search.sizeMin).toBe("20"))
  expect(
    await screen.findByRole("link", { name: "Smaller coin" })
  ).toBeVisible()

  router.history.forward()
  await waitFor(() => expect(router.state.location.search.sizeMin).toBe("25"))
  expect(await screen.findByRole("link", { name: "Larger coin" })).toBeVisible()
})
