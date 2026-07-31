import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { CompositionCreateForm } from "./composition-create-form"

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

vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({
    invalidate: vi.fn(),
  }),
}))

vi.mock("@tanstack/react-start", () => ({
  createServerFn: createServerFnMock,
  useServerFn: () => vi.fn(),
}))

describe("CompositionCreateForm", () => {
  it("suggests a broad reusable Composition category", () => {
    const markup = renderToStaticMarkup(createElement(CompositionCreateForm))

    expect(markup).toContain('placeholder="silver"')
    expect(markup).toContain('placeholder="Silver"')
    expect(markup).not.toContain("silver-900")
    expect(markup).not.toContain("Silver (.900)")
  })
})
