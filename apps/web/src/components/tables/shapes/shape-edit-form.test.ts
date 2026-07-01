import type { ShapeOption } from "@workspace/db"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { hasShapeEditChanges, ShapeEditForm } from "./shape-edit-form"

const shape: ShapeOption = {
  id: "2f0b5ff0-f4a9-4333-8f6d-dad19cd8510b",
  code: "round",
  name: "Round",
  createdAt: new Date("2026-07-01T00:00:00.000Z"),
  updatedAt: new Date("2026-07-01T00:00:00.000Z"),
}

describe("hasShapeEditChanges", () => {
  it("returns false when trimmed editable values match the current Shape", () => {
    expect(
      hasShapeEditChanges(shape, {
        code: " round ",
        name: " Round ",
      })
    ).toBe(false)
  })

  it("returns true when any normalized editable field changed", () => {
    expect(
      hasShapeEditChanges(shape, {
        code: "scalloped",
        name: "Scalloped",
      })
    ).toBe(true)
  })
})

describe("ShapeEditForm", () => {
  it("renders explicit Shape field labels with the current values and disables Save until something changed", () => {
    const markup = renderToStaticMarkup(createElement(ShapeEditForm, { shape }))
    const expectedFields = [
      ["Shape Code", 'value="round"'],
      ["Shape Name", 'value="Round"'],
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
