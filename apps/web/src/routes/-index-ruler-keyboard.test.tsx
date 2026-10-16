import { fireEvent, screen, waitFor } from "@testing-library/react"
import { expect, it, vi } from "vitest"

import {
  createArchiveFetch,
  renderArchiveRoute,
} from "@/test/archive-route-test"

it("searches Ruling Authorities by name and supports keyboard navigation", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      createArchiveFetch({
        engravers: [{ slug: "first-engraver", fullName: "First Engraver" }],
        issuers: [{ code: "AR", name: "Argentina" }],
      })
    )
  )
  const router = renderArchiveRoute(
    "/?issuer=AR&engraver=first-engraver&year=1986&page=3",
    [
      { slug: "first-authority", name: "First Authority" },
      { slug: "second-authority", name: "Second Authority" },
    ]
  )
  const combobox = await screen.findByRole("combobox", {
    name: "Ruler / Period",
  })

  combobox.focus()
  fireEvent.input(combobox, { target: { value: "Second" } })
  fireEvent.keyDown(combobox, { key: "ArrowDown" })
  const option = screen.getByRole("option", { name: "Second Authority" })
  expect(option).toHaveAttribute("data-highlighted")
  expect(combobox).toHaveAttribute("aria-activedescendant", option.id)
  fireEvent.click(option, { detail: 0 })

  await waitFor(() =>
    expect(router.state.location.search).toEqual({
      issuer: "AR",
      ruler: "second-authority",
      engraver: "first-engraver",
      year: 1986,
    })
  )
  expect(combobox).toHaveFocus()
})
