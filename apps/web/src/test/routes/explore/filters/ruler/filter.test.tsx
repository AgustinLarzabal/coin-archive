import { fireEvent, screen, waitFor } from "@testing-library/react"
import { expect, it, vi } from "vitest"

import {
  createArchiveFetch,
  renderArchiveRoute,
} from "@/test/archive-route-test"

const rulers = [
  { slug: "shared-a", name: "Shared Name" },
  { slug: "shared-b", name: "Shared Name" },
]

it("selects a global Ruling Authority, disambiguates duplicate names, and preserves other filters", async () => {
  const fetchMock = vi.fn(
    createArchiveFetch({
      pagination: {
        page: 3,
        pageSize: 24,
        totalItems: 49,
        totalPages: 3,
      },
    })
  )
  vi.stubGlobal("fetch", fetchMock)
  const router = renderArchiveRoute(
    "/?issuer=AR&engraver=first-engraver&year=1986&page=3",
    rulers
  )
  const combobox = await screen.findByRole("combobox", {
    name: "Ruler / Period",
  })

  combobox.focus()
  fireEvent.input(combobox, { target: { value: "shared-b" } })
  fireEvent.keyDown(combobox, { key: "ArrowDown" })
  const selectedOption = await screen.findByRole("option", {
    name: "Shared Name (shared-b)",
  })
  expect(selectedOption).toHaveAttribute("data-highlighted")
  fireEvent.click(selectedOption, { detail: 0 })

  await waitFor(() =>
    expect(router.state.location.search).toEqual({
      issuer: "AR",
      ruler: "shared-b",
      engraver: "first-engraver",
      year: 1986,
    })
  )
  expect(fetchMock).toHaveBeenCalledWith(
    "http://localhost:3001/v1/coins?issuer=AR&engraver=first-engraver&ruler=shared-b&year=1986&page=1&pageSize=24"
  )
})
