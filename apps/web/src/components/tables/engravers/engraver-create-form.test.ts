import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { EngraverCreateForm } from "./engraver-create-form"

vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({
    invalidate: vi.fn(),
  }),
}))

vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => ({
    inputValidator() {
      return this
    },
    handler() {
      return {}
    },
  }),
  useServerFn: () => vi.fn(),
}))

describe("EngraverCreateForm", () => {
  it("renders explicit Engraver field labels and disables Create until the draft is complete", () => {
    const markup = renderToStaticMarkup(createElement(EngraverCreateForm))
    const expectedFields = [
      ["Engraver Code", 'placeholder="barth"'],
      ["Engraver Name", 'placeholder="Barth"'],
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
