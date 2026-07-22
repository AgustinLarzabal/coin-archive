import type { EngraverOption } from "@workspace/db"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { EngraversTable } from "./engravers-table"

const engravers: EngraverOption[] = [
  {
    id: "2816420d-cde4-4984-b5af-2aa4c5d2720d",
    code: "barth",
    name: "Barth",
  },
  {
    id: "0a0ef926-8e38-4fcc-a62e-4df0b46ebfa2",
    code: "ortiz",
    name: "Ortiz",
  },
]

describe("EngraversTable", () => {
  it("renders Engraver Name and Engraver Code columns with maintenance affordances", () => {
    const markup = renderToStaticMarkup(
      <EngraversTable engravers={engravers} />
    )

    expect(markup).toContain("Engraver Name")
    expect(markup).toContain("Engraver Code")
    expect(markup).toContain("Barth")
    expect(markup).toContain("Ortiz")
    expect(markup).toContain(">Create</button>")
    expect(markup).toContain('aria-label="Actions"')
  })
})
