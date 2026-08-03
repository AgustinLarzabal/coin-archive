import type { RulerGroup } from "@coin-archive/api"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { RulerGroupEditForm } from "./ruler-group-edit-form"
import { hasRulerGroupEditChanges } from "./ruler-group-form.shared"

const rulerGroup: RulerGroup = {
  id: "eb80363e-d0dc-4a28-8a43-297fbd5d67fc",
  code: "reeded",
  name: "Reeded",
  version: 1,
  etag: '"ruler-group-version-1"',
  createdAt: "2026-06-24T12:00:00.000Z",
  updatedAt: "2026-06-24T12:00:00.000Z",
}

describe("hasRulerGroupEditChanges", () => {
  it("returns false when trimmed editable values match the current RulerGroup", () => {
    expect(
      hasRulerGroupEditChanges(rulerGroup, {
        code: " reeded ",
        name: " Reeded ",
      })
    ).toBe(false)
  })

  it("returns true when any normalized editable field changed", () => {
    expect(
      hasRulerGroupEditChanges(rulerGroup, {
        code: "plain",
        name: "Plain",
      })
    ).toBe(true)
  })
})

describe("RulerGroupEditForm", () => {
  it("renders explicit RulerGroup field labels with the current values and disables Save until something changed", () => {
    const markup = renderToStaticMarkup(
      createElement(RulerGroupEditForm, { rulerGroup })
    )
    const expectedFields = [
      ["Ruler Group Code", 'value="reeded"'],
      ["Ruler Group Name", 'value="Reeded"'],
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
