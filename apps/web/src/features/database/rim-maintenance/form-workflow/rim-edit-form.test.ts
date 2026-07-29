import type { RimOption } from "@coin-archive/db"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { hasRimEditChanges, RimEditForm } from "./rim-edit-form"

const rim: RimOption = {
  id: "dff33645-e973-4fd5-a84d-bf5a773855ef",
  code: "raised",
  name: "Raised rim",
  createdAt: new Date("2026-07-01T00:00:00.000Z"),
  updatedAt: new Date("2026-07-01T00:00:00.000Z"),
}

describe("hasRimEditChanges", () => {
  it("returns false when trimmed editable values match the current Rim", () => {
    expect(
      hasRimEditChanges(rim, {
        code: " raised ",
        name: " Raised rim ",
      })
    ).toBe(false)
  })

  it("returns true when any normalized editable field changed", () => {
    expect(
      hasRimEditChanges(rim, {
        code: "barred",
        name: "Barred rim",
      })
    ).toBe(true)
  })
})

describe("RimEditForm", () => {
  it("renders explicit Rim field labels with the current values and disables Save until something changed", () => {
    const markup = renderToStaticMarkup(createElement(RimEditForm, { rim }))
    const expectedFields = [
      ["Rim Code", 'value="raised"'],
      ["Rim Name", 'value="Raised rim"'],
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
