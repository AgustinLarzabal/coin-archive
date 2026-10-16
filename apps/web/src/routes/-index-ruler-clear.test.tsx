import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import { expect, it, vi } from "vitest"

import {
  createArchiveFetch,
  renderArchiveRoute,
} from "@/test/archive-route-test"

it("clears only the selected Ruling Authority and returns to the first page", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      createArchiveFetch({
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
    "/?issuer=AR&ruler=selected-authority&engraver=first-engraver&year=1986&page=3",
    [{ slug: "selected-authority", name: "Selected Authority" }]
  )
  const combobox = await screen.findByRole("combobox", {
    name: "Ruler / Period",
  })
  const control = combobox.closest('[data-slot="input-group"]')
  expect(control).not.toBeNull()

  fireEvent.click(
    within(control as HTMLElement).getByRole("button", { name: "Clear" })
  )

  await waitFor(() =>
    expect(router.state.location.search).toEqual({
      issuer: "AR",
      engraver: "first-engraver",
      year: 1986,
    })
  )
})
