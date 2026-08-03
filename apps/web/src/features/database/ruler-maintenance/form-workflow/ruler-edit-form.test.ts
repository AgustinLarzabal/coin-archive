import type { RulerGroupOption, Ruler  } from "@coin-archive/api"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { hasRulerEditChanges, RulerEditForm } from "./ruler-edit-form"

const rulerGroups: RulerGroupOption[] = [
  {
    id: "6f18a1db-9096-433b-b3f1-906c772f7a29",
    code: "house-of-bourbon",
    name: "House of Bourbon",
  },
  {
    id: "de2dcfb7-dc50-4035-8bc8-33cbbacb586b",
    code: "julio-claudians",
    name: "Julio-Claudians",
  },
]

const ruler: Ruler = {
  id: "2f0b5ff0-f4a9-4333-8f6d-dad19cd8510b",
  code: "felipe-v",
  name: "Felipe V",
  group: {
    id: rulerGroups[0].id,
    code: rulerGroups[0].code,
    name: rulerGroups[0].name,
  },
  version: 1,
  createdAt: "2026-08-03T00:00:00.000Z",
  updatedAt: "2026-08-03T00:00:00.000Z",
  etag: '"ruler-etag"',
}

describe("hasRulerEditChanges", () => {
  it("returns false when trimmed editable values match the current Ruler", () => {
    expect(
      hasRulerEditChanges(ruler, {
        code: " felipe-v ",
        name: " Felipe V ",
        rulerGroupLabel: " House of Bourbon (house-of-bourbon) ",
      })
    ).toBe(false)
  })

  it("returns true when any normalized editable field changed", () => {
    expect(
      hasRulerEditChanges(ruler, {
        code: "felipe-vi",
        name: "Felipe VI",
        rulerGroupLabel: "Julio-Claudians (julio-claudians)",
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
      ["Ruler Code", 'value="felipe-v"'],
      ["Ruler Name", 'value="Felipe V"'],
      ["Ruler Group", 'value="House of Bourbon (house-of-bourbon)"'],
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
