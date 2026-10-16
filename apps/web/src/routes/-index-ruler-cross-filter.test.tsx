import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
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
  const user = userEvent.setup()

  await user.click(
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

it("preserves the selected Ruling Authority when the Engraver changes", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      createArchiveFetch({
        engravers: [{ slug: "first-engraver", fullName: "First Engraver" }],
      })
    )
  )
  const router = renderArchiveRoute(
    "/?ruler=selected-authority&engraver=first-engraver&year=1986&page=3",
    [{ slug: "selected-authority", name: "Selected Authority" }]
  )
  await screen.findByRole("combobox", { name: "Ruler / Period" })
  const engraverCombobox = screen.getByRole("combobox", { name: "Engraver" })
  const control = engraverCombobox.closest('[data-slot="input-group"]')
  expect(control).not.toBeNull()
  const user = userEvent.setup()

  await user.click(
    within(control as HTMLElement).getByRole("button", { name: "Clear" })
  )

  await waitFor(() =>
    expect(router.state.location.search).toEqual({
      ruler: "selected-authority",
      year: 1986,
    })
  )
})

it("preserves the selected Ruling Authority when the Year changes", async () => {
  vi.stubGlobal("fetch", vi.fn(createArchiveFetch()))
  const router = renderArchiveRoute(
    "/?ruler=selected-authority&year=1986&page=3",
    [{ slug: "selected-authority", name: "Selected Authority" }]
  )
  await screen.findByRole("combobox", { name: "Ruler / Period" })
  const year = screen.getByRole("textbox", { name: "Year" })
  const user = userEvent.setup()

  await user.clear(year)
  await user.type(year, "2004")
  await user.click(screen.getByRole("button", { name: "Apply Year" }))

  await waitFor(() =>
    expect(router.state.location.search).toEqual({
      ruler: "selected-authority",
      year: 2004,
    })
  )
})
