import type { TechniqueOption } from "@workspace/db"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { getTechniqueOptionLabel } from "../lib/coin-search"
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

const selectedTechnique = techniques[0]

describe("TechniqueFilterCombobox", () => {
  it("restores the selected homepage Minting Technique label and URL value", () => {
    const markup = renderToStaticMarkup(
      <TechniqueFilterCombobox
        onValueChange={() => Promise.resolve()}
        selectedTechnique={selectedTechnique}
        techniques={techniques}
      />
    )

    expect(markup).toContain(
      `value="${getTechniqueOptionLabel(selectedTechnique)}"`
    )
    expect(markup).toContain(
      `&quot;code&quot;:&quot;${selectedTechnique.code}&quot;`
    )
  })
})
