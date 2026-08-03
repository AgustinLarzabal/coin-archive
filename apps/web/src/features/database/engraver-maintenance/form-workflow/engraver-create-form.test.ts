import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { EngraverCreateForm } from "./engraver-create-form"

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

function renderEngraverCreateForm() {
  return renderToStaticMarkup(createElement(EngraverCreateForm))
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

describe("EngraverCreateForm", () => {
  it("renders explicit Engraver field labels and disables Create until the draft is complete", () => {
    const markup = renderEngraverCreateForm()
    const expectedFields = [
      ["Engraver Code", 'placeholder="round"'],
      ["Engraver Name", 'placeholder="Round"'],
    ] as const

    for (const [label, placeholder] of expectedFields) {
      expect(markup).toContain(label)
      expect(markup).toContain(placeholder)
    }

    expect(markup).toContain('id="database-engraver-create-form"')
    expect(markup).toContain(">Create<")
    expect(markup).toContain('type="submit"')
    expect(markup).toContain('disabled=""')
  })
})
