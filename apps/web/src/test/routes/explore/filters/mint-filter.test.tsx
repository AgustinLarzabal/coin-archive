import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import { expect, it, vi } from "vitest"

import {
  createArchiveFetch,
  jsonResponse,
  renderArchiveRoute,
} from "@/test/archive-route-test"

const mint = {
  id: "40000000-0000-4000-8000-000000000001",
  slug: "rome-italy",
  name: "Rome Mint",
  place: "Rome",
  country: { code: "IT", name: "Italy" },
  startYear: 1900,
  endYear: null,
  operating: true,
}

it("shows the filtered empty state for a Mint with no Coins", async () => {
  vi.stubGlobal("fetch", vi.fn(createArchiveFetch({ mints: [mint] })))
  renderArchiveRoute("/?mint=rome-italy", [], [], undefined, [mint])

  expect(
    await screen.findByText("No coins match the selected filters.")
  ).toBeVisible()
})

it("selects one Mint, preserves other filters, and resets pagination", async () => {
  const fetchMock = vi.fn(createArchiveFetch({ mints: [mint] }))
  vi.stubGlobal("fetch", fetchMock)
  const router = renderArchiveRoute("/?issuer=IT&page=3", [], [], undefined, [
    mint,
  ])
  const combobox = await screen.findByRole("combobox", { name: "Mint" })
  const control = combobox.parentElement
  if (!control) throw new Error("Mint combobox control not found")
  fireEvent.click(
    within(control).getByRole("button", { name: "Toggle options" })
  )
  fireEvent.click(screen.getByRole("option", { name: "Rome Mint" }), {
    detail: 0,
  })

  await waitFor(() =>
    expect(router.state.location.search).toEqual({
      issuer: "IT",
      mint: "rome-italy",
    })
  )
  expect(fetchMock).toHaveBeenCalledWith(
    "http://localhost:3001/v1/coins?issuer=IT&mint=rome-italy&page=1&pageSize=24"
  )
})

it("shows an unknown Mint and keeps its URL slug for recovery", async () => {
  vi.stubGlobal("fetch", vi.fn(createArchiveFetch({ mints: [mint] })))
  renderArchiveRoute("/?mint=missing-mint", [], [], undefined, [mint])
  expect(await screen.findByText("Mint not found")).toBeVisible()
  expect(screen.getByRole("combobox", { name: "Mint" })).toHaveValue(
    "Unknown Mint (missing-mint)"
  )
})

it("distinguishes Mints that share a name", async () => {
  const secondMint = {
    ...mint,
    id: "40000000-0000-4000-8000-000000000002",
    slug: "rome-mint-vatican",
    place: "Vatican City",
    country: { code: "VA", name: "Vatican City" },
  }
  vi.stubGlobal(
    "fetch",
    vi.fn(createArchiveFetch({ mints: [mint, secondMint] }))
  )
  renderArchiveRoute("/?mint=rome-mint-vatican", [], [], undefined, [
    mint,
    secondMint,
  ])

  expect(await screen.findByRole("combobox", { name: "Mint" })).toHaveValue(
    "Rome Mint (Vatican City, Vatican City; rome-mint-vatican)"
  )
})

it("shows a Mint catalogue request failure", async () => {
  vi.stubGlobal("fetch", vi.fn(createArchiveFetch()))
  renderArchiveRoute("/", [], [], undefined, jsonResponse({}, 503))
  expect(await screen.findByText("Unable to load Mints")).toBeVisible()
})
