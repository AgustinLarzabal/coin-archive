import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { MintCreateForm } from "./mint-create-form"

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

function renderMintCreateForm() {
  return renderToStaticMarkup(createElement(MintCreateForm))
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

describe("MintCreateForm", () => {
  it("renders explicit Mint field labels and disables Create until the draft is complete", () => {
    const markup = renderMintCreateForm()
    const expectedFields = [
      ["Mint Code", 'placeholder="buenos-aires-mint"'],
      ["Mint Name", 'placeholder="Buenos Aires Mint"'],
    ] as const

    for (const [label, placeholder] of expectedFields) {
      expect(markup).toContain(label)
      expect(markup).toContain(placeholder)
    }

    expect(markup).toContain('id="database-mint-create-form"')
    expect(markup).toContain(">Create<")
    expect(markup).toContain('type="submit"')
    expect(markup).toContain('disabled=""')
  })
})
