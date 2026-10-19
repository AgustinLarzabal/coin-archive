import { fireEvent, screen, waitFor } from "@testing-library/react"
import { expect, it, vi } from "vitest"

import {
  createArchiveFetch,
  renderArchiveRoute,
} from "@/test/archive-route-test"

it("supports keyboard navigation and preserves the Issuer on selection", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      createArchiveFetch({
        engravers: [
          { slug: "first-engraver", fullName: "First Engraver" },
          { slug: "second-engraver", fullName: "Second Engraver" },
        ],
        issuers: [{ name: "Argentina", code: "AR" }],
      })
    )
  )
  const router = renderArchiveRoute("/?issuer=AR")
  const combobox = await screen.findByRole("combobox", { name: "Engraver" })

  combobox.focus()
  fireEvent.input(combobox, { target: { value: "Second" } })
  fireEvent.keyDown(combobox, { key: "ArrowDown" })
  const option = screen.getByRole("option", { name: "Second Engraver" })
  expect(option).toHaveAttribute("data-highlighted")
  fireEvent.click(option, { detail: 0 })

  await waitFor(() =>
    expect(router.state.location.search).toEqual({
      issuer: "AR",
      engraver: "second-engraver",
    })
  )
  expect(combobox).toHaveFocus()
})
