import type { Engraver } from "@coin-archive/api"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { EngraverEditForm } from "./engraver-edit-form"
import { hasEngraverEditChanges } from "./engraver-form.shared"

const engraver: Engraver = {
  id: "eb80363e-d0dc-4a28-8a43-297fbd5d67fc",
  code: "reeded",
  name: "Reeded",
  version: 1,
  etag: '"engraver-version-1"',
  createdAt: "2026-06-24T12:00:00.000Z",
  updatedAt: "2026-06-24T12:00:00.000Z",
}

describe("hasEngraverEditChanges", () => {
  it("returns false when trimmed editable values match the current Engraver", () => {
    expect(
      hasEngraverEditChanges(engraver, {
        code: " reeded ",
        name: " Reeded ",
      })
    ).toBe(false)
  })

  it("returns true when any normalized editable field changed", () => {
    expect(
      hasEngraverEditChanges(engraver, {
        code: "plain",
        name: "Plain",
      })
    ).toBe(true)
  })
})

describe("EngraverEditForm", () => {
  it("renders explicit Engraver field labels with the current values and disables Save until something changed", () => {
    const markup = renderToStaticMarkup(
      createElement(EngraverEditForm, { engraver })
    )
    const expectedFields = [
      ["Engraver Code", 'value="reeded"'],
      ["Engraver Name", 'value="Reeded"'],
    ] as const

    for (const [label, value] of expectedFields) {
      expect(markup).toContain(label)
      expect(markup).toContain(value)
    }

    expect(markup).toContain(">Save<")
    expect(markup).toContain('type="submit"')
    expect(markup).toContain('disabled=""')
  })
})
