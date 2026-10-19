import { fireEvent, screen, waitFor } from "@testing-library/react"
import { expect, it, vi } from "vitest"

import {
  createArchiveFetch,
  renderArchiveRoute,
} from "@/test/archive-route-test"

const currencies = [
  { slug: "euro", name: "Euro", fullName: "Euro (1999–present)" },
]

it("restores the Currency filter and results with browser Back and Forward", async () => {
  const fetchMock = vi.fn(createArchiveFetch())
  vi.stubGlobal("fetch", fetchMock)
  const router = renderArchiveRoute("/", [], currencies)
  const combobox = await screen.findByRole("combobox", { name: "Currency" })

  fireEvent.input(combobox, { target: { value: "Euro" } })
  fireEvent.keyDown(combobox, { key: "ArrowDown" })
  fireEvent.click(
    await screen.findByRole("option", { name: "Euro (1999–present)" }),
    { detail: 0 }
  )
  await waitFor(() =>
    expect(router.state.location.search.currency).toBe("euro")
  )

  router.history.back()
  await waitFor(() =>
    expect(router.state.location.search.currency).toBeUndefined()
  )
  expect(combobox).toHaveValue("")
  router.history.forward()
  await waitFor(() =>
    expect(router.state.location.search.currency).toBe("euro")
  )
  expect(combobox).toHaveValue("Euro (1999–present)")
  expect(fetchMock).toHaveBeenCalledWith(
    "http://localhost:3001/v1/coins?page=1&pageSize=24"
  )
  expect(fetchMock).toHaveBeenCalledWith(
    "http://localhost:3001/v1/coins?currency=euro&page=1&pageSize=24"
  )
})
