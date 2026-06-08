import type { RimOption } from "@workspace/db"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { RimFilterCombobox } from "./rim-filter-combobox"

const timestamp = new Date("2026-06-08T00:00:00.000Z")

const rims: RimOption[] = [
  {
    id: "rim-1",
    code: "raised-both-sides",
    name: "Raised, both sides",
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  {
    id: "rim-2",
    code: "plain",
    name: "Plain",
    createdAt: timestamp,
    updatedAt: timestamp,
  },
]

describe("RimFilterCombobox", () => {
  it("renders the homepage Rim combobox with the selected rim name and code label", () => {
    const markup = renderToStaticMarkup(
      <RimFilterCombobox
        onValueChange={() => Promise.resolve()}
        rims={rims}
        selectedRim={rims[0]}
      />
    )

    expect(markup).toContain("Raised, both sides")
    expect(markup).toContain("raised-both-sides")
  })
})
