import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { MintingTechniqueCreateForm } from "./minting-technique-create-form"

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

function renderMintingTechniqueCreateForm() {
  return renderToStaticMarkup(createElement(MintingTechniqueCreateForm))
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

describe("MintingTechniqueCreateForm", () => {
  it("renders explicit MintingTechnique field labels and disables Create until the draft is complete", () => {
    const markup = renderMintingTechniqueCreateForm()
    const expectedFields = [
      ["Minting Technique Code", 'placeholder="hammered"'],
      ["Minting Technique Name", 'placeholder="Hammered"'],
    ] as const

    for (const [label, placeholder] of expectedFields) {
      expect(markup).toContain(label)
      expect(markup).toContain(placeholder)
    }

    expect(markup).toContain('id="database-minting-technique-create-form"')
    expect(markup).toContain(">Create<")
    expect(markup).toContain('type="submit"')
    expect(markup).toContain('disabled=""')
  })
})
