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

    expect(markup).toContain("Currency Code")
    expect(markup).toContain("Currency Name")
    expect(markup).toContain("Currency Full Name")
    expect(markup).toContain('value="united-states-dollar"')
    expect(markup).toContain('value="Dollar"')
    expect(markup).toContain('value="United States dollar"')
    expect(markup).toContain(">Save</span>")
    expect(markup).toContain("disabled")
  })
})
