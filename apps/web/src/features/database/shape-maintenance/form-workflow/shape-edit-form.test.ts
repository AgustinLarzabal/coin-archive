import type { Shape } from "@coin-archive/api"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { ShapeEditForm } from "./shape-edit-form"
import { hasShapeEditChanges } from "./shape-form.shared"

const shape: Shape = {
  id: "eb80363e-d0dc-4a28-8a43-297fbd5d67fc",
  code: "reeded",
  name: "Reeded",
  version: 1,
  etag: '"shape-version-1"',
  createdAt: "2026-06-24T12:00:00.000Z",
  updatedAt: "2026-06-24T12:00:00.000Z",
}

describe("hasShapeEditChanges", () => {
  it("returns false when trimmed editable values match the current Shape", () => {
    expect(
      hasShapeEditChanges(shape, {
        code: " reeded ",
        name: " Reeded ",
      })
    ).toBe(false)
  })

  it("returns true when any normalized editable field changed", () => {
    expect(
      hasShapeEditChanges(shape, {
        code: "plain",
        name: "Plain",
      })
    ).toBe(true)
  })
})

describe("ShapeEditForm", () => {
  it("renders explicit Shape field labels with the current values and disables Save until something changed", () => {
    const markup = renderToStaticMarkup(createElement(ShapeEditForm, { shape }))
    const expectedFields = [
      ["Shape Code", 'value="reeded"'],
      ["Shape Name", 'value="Reeded"'],
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
