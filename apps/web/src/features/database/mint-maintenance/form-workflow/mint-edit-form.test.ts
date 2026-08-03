import type { Mint } from "@coin-archive/api"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { MintEditForm } from "./mint-edit-form"
import { hasMintEditChanges } from "./mint-form.shared"

const mint: Mint = {
  id: "eb80363e-d0dc-4a28-8a43-297fbd5d67fc",
  code: "madrid",
  name: "Madrid",
  version: 1,
  etag: '"mint-version-1"',
  createdAt: "2026-06-24T12:00:00.000Z",
  updatedAt: "2026-06-24T12:00:00.000Z",
}

describe("hasMintEditChanges", () => {
  it("returns false when trimmed editable values match the current Mint", () => {
    expect(
      hasMintEditChanges(mint, {
        code: " madrid ",
        name: " Madrid ",
      })
    ).toBe(false)
  })

  it("returns true when any normalized editable field changed", () => {
    expect(
      hasMintEditChanges(mint, {
        code: "london",
        name: "London",
      })
    ).toBe(true)
  })
})

describe("MintEditForm", () => {
  it("renders explicit Mint field labels with the current values and disables Save until something changed", () => {
    const markup = renderToStaticMarkup(createElement(MintEditForm, { mint }))
    const expectedFields = [
      ["Mint Code", 'value="madrid"'],
      ["Mint Name", 'value="Madrid"'],
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
