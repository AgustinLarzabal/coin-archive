import type { Mint } from "@coin-archive/api"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { MintEditForm } from "./mint-edit-form"
import { hasMintEditChanges } from "./mint-form.shared"

const mint: Mint = {
  id: "eb80363e-d0dc-4a28-8a43-297fbd5d67fc",
  code: "reeded",
  name: "Reeded",
  version: 1,
  etag: '"mint-version-1"',
  createdAt: "2026-06-24T12:00:00.000Z",
  updatedAt: "2026-06-24T12:00:00.000Z",
}

describe("hasMintEditChanges", () => {
  it("returns false when trimmed editable values match the current Mint", () => {
    expect(
      hasMintEditChanges(mint, {
        code: " reeded ",
        name: " Reeded ",
      })
    ).toBe(false)
  })

  it("returns true when any normalized editable field changed", () => {
    expect(
      hasMintEditChanges(mint, {
        code: "plain",
        name: "Plain",
      })
    ).toBe(true)
  })
})

describe("MintEditForm", () => {
  it("renders explicit Mint field labels with the current values and disables Save until something changed", () => {
    const markup = renderToStaticMarkup(createElement(MintEditForm, { mint }))
    const expectedFields = [
      ["Mint Code", 'value="reeded"'],
      ["Mint Name", 'value="Reeded"'],
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
