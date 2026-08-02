import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { DistributionCreateForm } from "./distribution-create-form"

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

describe("DistributionCreateForm", () => {
  it("suggests a broad reusable Distribution category", () => {
    const markup = renderToStaticMarkup(createElement(DistributionCreateForm))

    expect(markup).toContain('placeholder="standard-circulation"')
    expect(markup).toContain('placeholder="Standard circulation"')
    expect(markup).not.toContain("silver-900")
    expect(markup).not.toContain("Silver (.900)")
  })
})
