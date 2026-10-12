import { fireEvent, screen } from "@testing-library/react"
import { expect, it, vi } from "vitest"

import {
  createArchiveFetch,
  renderArchiveRoute,
} from "@/test/archive-route-test"

it("shows a disabled recovery option for an unknown Engraver Slug", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      createArchiveFetch({
        engravers: [{ slug: "first-engraver", fullName: "First Engraver" }],
        issuers: [{ name: "Argentina", code: "AR" }],
      })
    )
  )
  renderArchiveRoute("/?issuer=AR&engraver=unknown-engraver")

  expect(await screen.findByText("Engraver not found")).toBeVisible()
  const combobox = screen.getByRole("combobox", { name: "Engraver" })
  expect(combobox).toHaveValue("Unknown engraver (unknown-engraver)")

  combobox.focus()
  fireEvent.keyDown(combobox, { key: "ArrowDown" })
  expect(
    await screen.findByRole("option", {
      name: "Unknown engraver (unknown-engraver)",
    })
  ).toHaveAttribute("aria-disabled", "true")
})
