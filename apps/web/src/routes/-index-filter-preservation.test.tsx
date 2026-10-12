import { fireEvent, screen, waitFor } from "@testing-library/react"
import { expect, it, vi } from "vitest"

import {
  createArchiveFetch,
  renderArchiveRoute,
} from "@/test/archive-route-test"

vi.mock("@workspace/ui/components/select", () => ({
  Select: ({
    onValueChange,
    value,
  }: {
    onValueChange: (value: string | null) => void
    value: string
  }) => (
    <button
      type="button"
      role="combobox"
      aria-label="Issuer"
      onClick={() => onValueChange(value === "AR" ? "ROMAN" : null)}
    >
      {value || "All issuers"}
    </button>
  ),
  SelectContent: () => null,
  SelectGroup: () => null,
  SelectItem: () => null,
  SelectTrigger: () => null,
  SelectValue: () => null,
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
  const issuerSelect = await screen.findByRole("combobox", { name: "Issuer" })

  fireEvent.click(issuerSelect)
  await waitFor(() =>
    expect(router.state.location.search).toEqual({
      issuer: "ROMAN",
      engraver: "first-engraver",
    })
  )

  fireEvent.click(issuerSelect)
  await waitFor(() =>
    expect(router.state.location.search).toEqual({
      engraver: "first-engraver",
    })
  )
})
