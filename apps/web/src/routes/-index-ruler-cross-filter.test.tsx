import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import { expect, it, vi } from "vitest"

import {
  createArchiveFetch,
  renderArchiveRoute,
} from "@/test/archive-route-test"

it("preserves the selected Ruling Authority when the Issuer changes", async () => {
  vi.stubGlobal("fetch", vi.fn(createArchiveFetch()))
  const router = renderArchiveRoute(
    "/?issuer=AR&ruler=selected-authority&engraver=first-engraver&year=1986&page=3",
    [{ slug: "selected-authority", name: "Selected Authority" }]
  )
  expect(
    await screen.findByRole("combobox", { name: "Ruler / Period" })
  ).toHaveValue("Selected Authority")
  const issuerCombobox = screen.getByRole("combobox", { name: "Issuer" })
  const control = issuerCombobox.closest('[data-slot="input-group"]')
  expect(control).not.toBeNull()

  fireEvent.click(
    within(control as HTMLElement).getByRole("button", { name: "Clear" })
  )

  await waitFor(() =>
    expect(router.state.location.search).toEqual({
      ruler: "selected-authority",
      engraver: "first-engraver",
      year: 1986,
    })
  )
})
