import { fireEvent, screen, waitFor } from "@testing-library/react"
import { expect, it, vi } from "vitest"

import {
  createArchiveFetch,
  renderArchiveRoute,
} from "@/test/archive-route-test"

vi.mock("@coin-archive/ui/components/combobox", () => ({
  Combobox: ({
    name,
    onValueChange,
    value,
  }: {
    name?: string
    onValueChange: (value: string | null) => void
    value: string | null
  }) => (
    <button
      type="button"
      role="combobox"
      aria-label={name === "issuer" ? "Issuer" : "Engraver"}
      onClick={() => {
        if (name === "issuer") {
          onValueChange(value === "AR" ? "ROMAN" : null)
        }
      }}
    >
      {value}
    </button>
  ),
  ComboboxContent: () => null,
  ComboboxEmpty: () => null,
  ComboboxInput: () => null,
  ComboboxItem: () => null,
  ComboboxList: () => null,
}))

it("preserves the Engraver when the Issuer changes and clears", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      createArchiveFetch({
        engravers: [{ slug: "first-engraver", fullName: "First Engraver" }],
        issuers: [
          { name: "Argentina", code: "AR" },
          { name: "Roman Empire", code: "ROMAN" },
        ],
      })
    )
  )
  const router = renderArchiveRoute("/?issuer=AR&engraver=first-engraver")
  const issuerCombobox = await screen.findByRole("combobox", { name: "Issuer" })

  fireEvent.click(issuerCombobox)
  await waitFor(() =>
    expect(router.state.location.search).toEqual({
      issuer: "ROMAN",
      engraver: "first-engraver",
    })
  )

  fireEvent.click(issuerCombobox)
  await waitFor(() =>
    expect(router.state.location.search).toEqual({
      engraver: "first-engraver",
    })
  )
})
