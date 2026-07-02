import type { RulerGroupOption } from "@workspace/db"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { RulerCreateForm } from "./ruler-create-form"

function createServerFnMock() {
  return {
    inputValidator() {
      return this
    },
    handler() {
      return {}
    },
  }
}

const rulerGroups: RulerGroupOption[] = [
  {
    id: "2f0b5ff0-f4a9-4333-8f6d-dad19cd8510b",
    code: "house-of-bourbon",
    name: "House of Bourbon",
    createdAt: new Date("2026-07-01T00:00:00.000Z"),
    updatedAt: new Date("2026-07-01T00:00:00.000Z"),
  },
]

function renderRulerCreateForm() {
  return renderToStaticMarkup(
    createElement(RulerCreateForm, {
      rulerGroups,
    })
  )
}

vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({
    invalidate: vi.fn(),
  }),
}))

vi.mock("@tanstack/react-start", () => ({
  createServerFn: createServerFnMock,
  useServerFn: () => vi.fn(),
}))

describe("RulerCreateForm", () => {
  it("renders explicit Ruler field labels, the optional Ruler Group selector, and disables Create until the draft is complete", () => {
    const markup = renderRulerCreateForm()
    const expectedFields = [
      ["Ruler Code", 'placeholder="louis-xiv"'],
      ["Ruler Name", 'placeholder="Louis XIV"'],
      ["Ruler Group", 'placeholder="Search Ruler Group..."'],
    ] as const

    for (const [label, placeholder] of expectedFields) {
      expect(markup).toContain(label)
      expect(markup).toContain(placeholder)
    }

    expect(markup).toContain('id="database-ruler-create-form"')
    expect(markup).toContain('list="ruler-group-options-create"')
    expect(markup).toContain('value="House of Bourbon (house-of-bourbon)"')
    expect(markup).toContain(">Create<")
    expect(markup).toContain('type="submit"')
    expect(markup).toContain('disabled=""')
  })
})
