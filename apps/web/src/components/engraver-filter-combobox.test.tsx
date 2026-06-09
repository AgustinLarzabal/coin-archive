import type { EngraverOption } from "@workspace/db"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { EngraverFilterCombobox } from "./engraver-filter-combobox"

const timestamp = new Date("2026-06-08T00:00:00.000Z")

const engravers: EngraverOption[] = [
  {
    id: "engraver-1",
    code: "georgios-stamatopoulos",
    name: "Georgios Stamatópoulos",
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  {
    id: "engraver-2",
    code: "jose-maria",
    name: "José María",
    createdAt: timestamp,
    updatedAt: timestamp,
  },
]

describe("EngraverFilterCombobox", () => {
  it("renders the homepage Engraver combobox with the selected engraver name and code label", () => {
    const markup = renderToStaticMarkup(
      <EngraverFilterCombobox
        onValueChange={() => Promise.resolve()}
        selectedEngraver={engravers[0]}
        engravers={engravers}
      />
    )

    expect(markup).toContain("Georgios Stamatópoulos")
    expect(markup).toContain("georgios-stamatopoulos")
  })
})
