import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { ThemeCreateForm } from "./theme-create-form"

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

function renderThemeCreateForm() {
  return renderToStaticMarkup(createElement(ThemeCreateForm))
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

describe("ThemeCreateForm", () => {
  it("renders explicit Theme field labels and disables Create until the draft is complete", () => {
    const markup = renderThemeCreateForm()
    const expectedFields = [
      ["Theme Code", 'placeholder="map"'],
      ["Theme Name", 'placeholder="Map"'],
    ] as const

    for (const [label, placeholder] of expectedFields) {
      expect(markup).toContain(label)
      expect(markup).toContain(placeholder)
    }

    expect(markup).toContain('id="database-theme-create-form"')
    expect(markup).toContain(">Create<")
    expect(markup).toContain('type="submit"')
    expect(markup).toContain('disabled=""')
  })
})
