import type { EdgeOption } from "@coin-archive/db"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { EdgeEditForm } from "./edge-edit-form"
import { hasEdgeEditChanges } from "./edge-form.shared"

const edge: EdgeOption = {
  id: "eb80363e-d0dc-4a28-8a43-297fbd5d67fc",
  code: "reeded",
  name: "Reeded",
  createdAt: new Date("2026-06-24T12:00:00.000Z"),
  updatedAt: new Date("2026-06-24T12:00:00.000Z"),
}

describe("hasEdgeEditChanges", () => {
  it("returns false when trimmed editable values match the current Edge", () => {
    expect(
      hasEdgeEditChanges(edge, {
        code: " reeded ",
        name: " Reeded ",
      })
    ).toBe(false)
  })

  it("returns true when any normalized editable field changed", () => {
    expect(
      hasEdgeEditChanges(edge, {
        code: "plain",
        name: "Plain",
      })
    ).toBe(true)
  })
})

describe("EdgeEditForm", () => {
  it("renders explicit Edge field labels with the current values and disables Save until something changed", () => {
    const markup = renderToStaticMarkup(createElement(EdgeEditForm, { edge }))
    const expectedFields = [
      ["Edge Code", 'value="reeded"'],
      ["Edge Name", 'value="Reeded"'],
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
