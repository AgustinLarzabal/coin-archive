import type { Rim } from "@coin-archive/api"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { RimEditForm } from "./rim-edit-form"
import { hasRimEditChanges } from "./rim-form.shared"

const rim: Rim = {
  id: "eb80363e-d0dc-4a28-8a43-297fbd5d67fc",
  code: "reeded",
  name: "Reeded",
  version: 1,
  etag: '"rim-version-1"',
  createdAt: "2026-06-24T12:00:00.000Z",
  updatedAt: "2026-06-24T12:00:00.000Z",
}

describe("hasRimEditChanges", () => {
  it("returns false when trimmed editable values match the current Rim", () => {
    expect(
      hasRimEditChanges(rim, {
        code: " reeded ",
        name: " Reeded ",
      })
    ).toBe(false)
  })

  it("returns true when any normalized editable field changed", () => {
    expect(
      hasRimEditChanges(rim, {
        code: "plain",
        name: "Plain",
      })
    ).toBe(true)
  })
})

describe("RimEditForm", () => {
  it("renders explicit Rim field labels with the current values and disables Save until something changed", () => {
    const markup = renderToStaticMarkup(createElement(RimEditForm, { rim }))
    const expectedFields = [
      ["Rim Code", 'value="reeded"'],
      ["Rim Name", 'value="Reeded"'],
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
