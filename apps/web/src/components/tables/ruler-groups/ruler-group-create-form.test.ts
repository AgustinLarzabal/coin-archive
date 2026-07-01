import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { RulerGroupCreateForm } from "./ruler-group-create-form"

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

function renderRulerGroupCreateForm() {
  return renderToStaticMarkup(createElement(RulerGroupCreateForm))
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

describe("RulerGroupCreateForm", () => {
  it("renders explicit Ruler Group field labels and disables Create until the draft is complete", () => {
    const markup = renderRulerGroupCreateForm()
    const expectedFields = [
      ["Ruler Group Code", 'placeholder="house-of-bourbon"'],
      ["Ruler Group Name", 'placeholder="House of Bourbon"'],
    ] as const

    for (const [label, placeholder] of expectedFields) {
      expect(markup).toContain(label)
      expect(markup).toContain(placeholder)
    }

    expect(markup).toContain('id="database-ruler-group-create-form"')
    expect(markup).toContain(">Create<")
    expect(markup).toContain('type="submit"')
    expect(markup).toContain('disabled=""')
  })
})
