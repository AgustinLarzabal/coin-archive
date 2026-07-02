import type { RulerGroupOption, RulerOption } from "@workspace/db"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { hasRulerEditChanges, RulerEditForm } from "./ruler-edit-form"

const rulerGroups: RulerGroupOption[] = [
  {
    id: "2f0b5ff0-f4a9-4333-8f6d-dad19cd8510b",
    code: "house-of-bourbon",
    name: "House of Bourbon",
    createdAt: new Date("2026-07-01T00:00:00.000Z"),
    updatedAt: new Date("2026-07-01T00:00:00.000Z"),
  },
]

const ruler: RulerOption = {
  id: "49593601-9276-4761-a03b-f5e43cf674fd",
  code: "louis-xiv",
  name: "Louis XIV",
  group: {
    id: rulerGroups[0].id,
    code: rulerGroups[0].code,
    name: rulerGroups[0].name,
  },
}

describe("hasRulerEditChanges", () => {
  it("returns false when trimmed editable values match the current Ruler", () => {
    expect(
      hasRulerEditChanges(ruler, {
        code: " louis-xiv ",
        name: " Louis XIV ",
        rulerGroupLabel: " House of Bourbon (house-of-bourbon) ",
      })
    ).toBe(false)
  })

  it("returns true when any normalized editable field changed", () => {
    expect(
      hasRulerEditChanges(ruler, {
        code: "louis-the-great",
        name: "Louis XIV",
        rulerGroupLabel: "",
      })
    ).toBe(true)
  })
})

describe("RulerEditForm", () => {
  it("renders explicit Ruler field labels with the current values and disables Save until something changed", () => {
    const markup = renderToStaticMarkup(
      createElement(RulerEditForm, {
        ruler,
        rulerGroups,
      })
    )
    const expectedFields = [
      ["Ruler Code", 'value="louis-xiv"'],
      ["Ruler Name", 'value="Louis XIV"'],
      ["Ruler Group", 'value="House of Bourbon (house-of-bourbon)"'],
    ] as const

    for (const [label, value] of expectedFields) {
      expect(markup).toContain(label)
      expect(markup).toContain(value)
    }

    expect(markup).toContain('list="ruler-group-options-edit"')
    expect(markup).toContain(">Save<")
    expect(markup).toContain('type="submit"')
    expect(markup).toContain('disabled=""')
  })
})
