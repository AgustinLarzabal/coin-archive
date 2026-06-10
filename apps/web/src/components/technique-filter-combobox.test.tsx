import type { TechniqueOption } from "@workspace/db"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { TechniqueFilterCombobox } from "./technique-filter-combobox"

const timestamp = new Date("2026-06-08T00:00:00.000Z")

const techniques: TechniqueOption[] = [
  {
    id: "technique-1",
    code: "milled",
    name: "Milled",
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  {
    id: "technique-2",
    code: "hammered",
    name: "Hammered",
    createdAt: timestamp,
    updatedAt: timestamp,
  },
]

describe("TechniqueFilterCombobox", () => {
  it("renders the homepage Minting Technique combobox with the selected technique name and code label", () => {
    const markup = renderToStaticMarkup(
      <TechniqueFilterCombobox
        onValueChange={() => Promise.resolve()}
        selectedTechnique={techniques[0]}
        techniques={techniques}
      />
    )

    expect(markup).toContain("Milled")
    expect(markup).toContain("milled")
  })
})
