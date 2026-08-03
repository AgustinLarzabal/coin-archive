import type { Theme } from "@coin-archive/api"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { ThemeEditForm } from "./theme-edit-form"
import { hasThemeEditChanges } from "./theme-form.shared"

const theme: Theme = {
  id: "eb80363e-d0dc-4a28-8a43-297fbd5d67fc",
  code: "reeded",
  name: "Reeded",
  version: 1,
  etag: '"theme-version-1"',
  createdAt: "2026-06-24T12:00:00.000Z",
  updatedAt: "2026-06-24T12:00:00.000Z",
}

describe("hasThemeEditChanges", () => {
  it("returns false when trimmed editable values match the current Theme", () => {
    expect(
      hasThemeEditChanges(theme, {
        code: " reeded ",
        name: " Reeded ",
      })
    ).toBe(false)
  })

  it("returns true when any normalized editable field changed", () => {
    expect(
      hasThemeEditChanges(theme, {
        code: "plain",
        name: "Plain",
      })
    ).toBe(true)
  })
})

describe("ThemeEditForm", () => {
  it("renders explicit Theme field labels with the current values and disables Save until something changed", () => {
    const markup = renderToStaticMarkup(createElement(ThemeEditForm, { theme }))
    const expectedFields = [
      ["Theme Code", 'value="reeded"'],
      ["Theme Name", 'value="Reeded"'],
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
