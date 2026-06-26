import type { CurrencyOption } from "@workspace/db"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import {
  CurrencyEditForm,
  hasCurrencyEditChanges,
} from "./currency-edit-form"

const currency: CurrencyOption = {
  id: "0933c940-842f-42a6-bd41-e3a0d3d27e39",
  code: "united-states-dollar",
  name: "Dollar",
  fullName: "United States dollar",
  createdAt: new Date("2026-06-26T00:00:00.000Z"),
  updatedAt: new Date("2026-06-26T00:00:00.000Z"),
}

describe("hasCurrencyEditChanges", () => {
  it("returns false when trimmed editable values match the current Currency", () => {
    expect(
      hasCurrencyEditChanges(currency, {
        code: " united-states-dollar ",
        name: " Dollar ",
        fullName: " United States dollar ",
      })
    ).toBe(false)
  })

  it("returns true when any normalized editable field changed", () => {
    expect(
      hasCurrencyEditChanges(currency, {
        code: "argentine-peso",
        name: "Peso",
        fullName: "Argentine peso",
      })
    ).toBe(true)
  })
})

describe("CurrencyEditForm", () => {
  it("renders explicit Currency field labels with the current values and disables Save until something changed", () => {
    const markup = renderToStaticMarkup(
      createElement(CurrencyEditForm, { currency })
    )
    const expectedFields = [
      ["Currency Code", 'value="united-states-dollar"'],
      ["Currency Name", 'value="Dollar"'],
      ["Currency Full Name", 'value="United States dollar"'],
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
