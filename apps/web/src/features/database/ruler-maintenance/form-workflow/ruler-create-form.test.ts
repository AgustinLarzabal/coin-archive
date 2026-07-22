import type { RulerGroupOption } from "@workspace/db"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { RulerCreateForm } from "./ruler-create-form"

const rulerGroups: RulerGroupOption[] = [
  {
    id: "6f18a1db-9096-433b-b3f1-906c772f7a29",
    code: "house-of-bourbon",
    name: "House of Bourbon",
    createdAt: new Date("2026-07-01T00:00:00.000Z"),
    updatedAt: new Date("2026-07-01T00:00:00.000Z"),
  },
]

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
  it("renders explicit Ruler field labels and disables Create until the draft is complete", () => {
    const markup = renderRulerCreateForm()
    const expectedFields = [
      ["Ruler Code", 'placeholder="felipe-v"'],
      ["Ruler Name", 'placeholder="Felipe V"'],
      [
        "Ruler Group",
        'placeholder="House of Bourbon (house-of-bourbon)"',
      ],
    ] as const

    for (const [label, placeholder] of expectedFields) {
      expect(markup).toContain(label)
      expect(markup).toContain(placeholder)
    }

    expect(markup).toContain(
      'value="House of Bourbon (house-of-bourbon)"'
    )
    expect(markup).toContain('id="database-ruler-create-form"')
    expect(markup).toContain(">Create<")
    expect(markup).toContain('type="submit"')
    expect(markup).toContain('disabled=""')
  })
})
