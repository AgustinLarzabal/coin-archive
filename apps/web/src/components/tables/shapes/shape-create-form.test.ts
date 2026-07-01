import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { ShapeCreateForm } from "./shape-create-form"

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

function renderShapeCreateForm() {
  return renderToStaticMarkup(createElement(ShapeCreateForm))
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

describe("ShapeCreateForm", () => {
  it("renders explicit Shape field labels and disables Create until the draft is complete", () => {
    const markup = renderShapeCreateForm()
    const expectedFields = [
      ["Shape Code", 'placeholder="round"'],
      ["Shape Name", 'placeholder="Round"'],
    ] as const

    for (const [label, placeholder] of expectedFields) {
      expect(markup).toContain(label)
      expect(markup).toContain(placeholder)
    }

    expect(markup).toContain('id="database-shape-create-form"')
    expect(markup).toContain(">Create<")
    expect(markup).toContain('type="submit"')
    expect(markup).toContain('disabled=""')
  })
})
