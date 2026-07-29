import type { RulerGroupOption } from "@coin-archive/db"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import {
  hasRulerGroupEditChanges,
  RulerGroupEditForm,
} from "./ruler-group-edit-form"

const rulerGroup: RulerGroupOption = {
  id: "2f0b5ff0-f4a9-4333-8f6d-dad19cd8510b",
  code: "house-of-bourbon",
  name: "House of Bourbon",
  createdAt: new Date("2026-07-01T00:00:00.000Z"),
  updatedAt: new Date("2026-07-01T00:00:00.000Z"),
}

describe("hasRulerGroupEditChanges", () => {
  it("returns false when trimmed editable values match the current Ruler Group", () => {
    expect(
      hasRulerGroupEditChanges(rulerGroup, {
        code: " house-of-bourbon ",
        name: " House of Bourbon ",
      })
    ).toBe(false)
  })

  it("returns true when any normalized editable field changed", () => {
    expect(
      hasRulerGroupEditChanges(rulerGroup, {
        code: "house-of-capet",
        name: "House of Capet",
      })
    ).toBe(true)
  })
})

describe("RulerGroupEditForm", () => {
  it("renders explicit Ruler Group field labels with the current values and disables Save until something changed", () => {
    const markup = renderToStaticMarkup(
      createElement(RulerGroupEditForm, { rulerGroup })
    )
    const expectedFields = [
      ["Ruler Group Code", 'value="house-of-bourbon"'],
      ["Ruler Group Name", 'value="House of Bourbon"'],
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
