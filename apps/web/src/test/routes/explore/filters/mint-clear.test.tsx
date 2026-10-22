import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import { expect, it, vi } from "vitest"

import {
  createArchiveFetch,
  renderArchiveRoute,
} from "@/test/archive-route-test"

it("clears only the selected Mint and returns to the first page", async () => {
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
  vi.stubGlobal(
    "fetch",
    vi.fn(
      createArchiveFetch({
        mints: [mint],
        pagination: {
          page: 3,
          pageSize: 24,
          totalItems: 49,
          totalPages: 3,
        },
      })
    )
  )
  const router = renderArchiveRoute(
    "/?issuer=IT&mint=rome-italy&year=2004&page=3",
    [],
    [],
    undefined,
    [mint]
  )
  const combobox = await screen.findByRole("combobox", { name: "Mint" })
  const control = combobox.parentElement
  if (!control) throw new Error("Mint combobox control not found")
  fireEvent.click(within(control).getByRole("button", { name: "Clear Mint" }))

  await waitFor(() =>
    expect(router.state.location.search).toEqual({
      issuer: "IT",
      year: 2004,
    })
  )
})
