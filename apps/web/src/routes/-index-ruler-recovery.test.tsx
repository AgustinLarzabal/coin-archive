import { fireEvent, screen } from "@testing-library/react"
import { expect, it, vi } from "vitest"

import {
  createArchiveFetch,
  renderArchiveRoute,
} from "@/test/archive-route-test"

it("keeps a missing well-formed Ruling Authority visible as a disabled recovery option", async () => {
  vi.stubGlobal("fetch", vi.fn(createArchiveFetch()))
  renderArchiveRoute("/?ruler=missing-authority", [
    { slug: "known-authority", name: "Known Authority" },
  ])

  expect(await screen.findByText("Ruler / Period not found")).toBeVisible()
  const combobox = screen.getByRole("combobox", { name: "Ruler / Period" })
  expect(combobox).toHaveValue("Ruler / Period not found (missing-authority)")
  combobox.focus()
  fireEvent.keyDown(combobox, { key: "ArrowDown" })
  expect(
    await screen.findByRole("option", {
      name: "Ruler / Period not found (missing-authority)",
    })
  ).toHaveAttribute("aria-disabled", "true")
})
