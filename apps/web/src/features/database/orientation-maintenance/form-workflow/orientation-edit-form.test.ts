import type { Orientation as OrientationOption } from "@coin-archive/api"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { OrientationEditForm } from "./orientation-edit-form"
import { hasOrientationEditChanges } from "./orientation-form.shared"

const orientation: OrientationOption = {
  id: "eb80363e-d0dc-4a28-8a43-297fbd5d67fc",
  code: "reeded",
  name: "Reeded",
  version: 1,
  createdAt: "2026-06-24T12:00:00.000Z",
  updatedAt: "2026-06-24T12:00:00.000Z",
}

describe("hasOrientationEditChanges", () => {
  it("returns false when trimmed editable values match the current Orientation", () => {
    expect(
      hasOrientationEditChanges(orientation, {
        code: " reeded ",
        name: " Reeded ",
      })
    ).toBe(false)
  })

  it("returns true when any normalized editable field changed", () => {
    expect(
      hasOrientationEditChanges(orientation, {
        code: "plain",
        name: "Plain",
      })
    ).toBe(true)
  })
})

describe("OrientationEditForm", () => {
  it("renders explicit Orientation field labels with the current values and disables Save until something changed", () => {
    const markup = renderToStaticMarkup(
      createElement(OrientationEditForm, { orientation })
    )
    const expectedFields = [
      ["Orientation Code", 'value="reeded"'],
      ["Orientation Name", 'value="Reeded"'],
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
