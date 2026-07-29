import type { ThemeOption } from "@coin-archive/db"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { hasThemeEditChanges, ThemeEditForm } from "./theme-edit-form"

const theme: ThemeOption = {
  id: "2f0b5ff0-f4a9-4333-8f6d-dad19cd8510b",
  code: "map",
  name: "Map",
}

describe("hasThemeEditChanges", () => {
  it("returns false when trimmed editable values match the current Theme", () => {
    expect(
      hasThemeEditChanges(theme, {
        code: " map ",
        name: " Map ",
      })
    ).toBe(false)
  })

  it("returns true when any normalized editable field changed", () => {
    expect(
      hasThemeEditChanges(theme, {
        code: "animal",
        name: "Animal",
      })
    ).toBe(true)
  })
})

describe("ThemeEditForm", () => {
  it("renders explicit Theme field labels with the current values and disables Save until something changed", () => {
    const markup = renderToStaticMarkup(createElement(ThemeEditForm, { theme }))
    const expectedFields = [
      ["Theme Code", 'value="map"'],
      ["Theme Name", 'value="Map"'],
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
