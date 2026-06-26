import type { DistributionOption } from "@workspace/db"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import {
  DistributionEditForm,
  hasDistributionEditChanges,
} from "./distribution-edit-form"

const distribution: DistributionOption = {
  id: "84863d38-795b-443c-bd27-1dedb73c0fad",
  code: "standard-circulation",
  name: "Standard circulation",
}

describe("hasDistributionEditChanges", () => {
  it("returns false when trimmed editable values match the current Distribution", () => {
    expect(
      hasDistributionEditChanges(distribution, {
        code: " standard-circulation ",
        name: " Standard circulation ",
      })
    ).toBe(false)
  })

  it("returns true when any normalized editable field changed", () => {
    expect(
      hasDistributionEditChanges(distribution, {
        code: "circulating-commemorative",
        name: "Circulating commemorative",
      })
    ).toBe(true)
  })
})

describe("DistributionEditForm", () => {
  it("renders explicit Distribution field labels with the current values and disables Save until something changed", () => {
    const markup = renderToStaticMarkup(
      createElement(DistributionEditForm, { distribution })
    )
    const expectedFields = [
      ["Distribution Code", 'value="standard-circulation"'],
      ["Distribution Name", 'value="Standard circulation"'],
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
