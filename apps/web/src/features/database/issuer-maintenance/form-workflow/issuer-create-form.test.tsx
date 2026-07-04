import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { IssuerCreateForm } from "./issuer-create-form"

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

const issuers = [
  {
    id: "dc2f4da3-cfd0-43fa-8900-7a384fc6977a",
    code: "argentine-republic",
    isoCode: "AR",
    name: "Argentine Republic",
    parent: null,
  },
]

vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({
    invalidate: vi.fn(),
  }),
}))

vi.mock("@tanstack/react-start", () => ({
  createServerFn: createServerFnMock,
  useServerFn: () => vi.fn(),
}))

describe("IssuerCreateForm", () => {
  it("renders explicit Issuer field labels and disables Create until the draft is complete", () => {
    const markup = renderToStaticMarkup(
      createElement(IssuerCreateForm, { issuers })
    )
    const expectedFields = [
      ["Issuer Code", 'placeholder="argentine-republic"'],
      ["Issuer Name", 'placeholder="Argentine Republic"'],
      ["Issuer ISO Code", 'placeholder="AR"'],
      ["Parent Issuer", 'placeholder="Search Parent Issuer..."'],
    ] as const

    for (const [label, placeholder] of expectedFields) {
      expect(markup).toContain(label)
      expect(markup).toContain(placeholder)
    }

    expect(markup).toContain('id="database-issuer-create-form"')
    expect(markup).toContain(">Create<")
    expect(markup).toContain('type="submit"')
    expect(markup).toContain('disabled=""')
  })
})
