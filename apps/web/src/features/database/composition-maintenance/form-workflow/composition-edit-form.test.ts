import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import type { Composition } from "@coin-archive/api"
import { describe, expect, it, vi } from "vitest"

import {
  CompositionEditForm,
  hasCompositionEditChanges,
} from "./composition-edit-form"

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

const composition: Composition = {
  id: "0933c940-842f-42a6-bd41-e3a0d3d27e39",
  code: "silver-900",
  name: "Silver (.900)",
  version: 1,
  etag: '"composition-version-1"',
  createdAt: "2026-06-24T12:00:00.000Z",
  updatedAt: "2026-06-24T12:00:00.000Z",
}

describe("hasCompositionEditChanges", () => {
  it("returns false when trimmed editable values match the current Composition", () => {
    expect(
      hasCompositionEditChanges(composition, {
        code: " silver-900 ",
        name: " Silver (.900) ",
      })
    ).toBe(false)
  })

  it("returns true when any normalized editable field changed", () => {
    expect(
      hasCompositionEditChanges(composition, {
        code: "silver-925",
        name: "Silver (.925)",
      })
    ).toBe(true)
  })
})

describe("CompositionEditForm", () => {
  it("suggests a broad reusable Composition category", () => {
    const markup = renderToStaticMarkup(
      createElement(CompositionEditForm, { composition })
    )

    expect(markup).toContain('placeholder="silver"')
    expect(markup).toContain('placeholder="Silver"')
    expect(markup).not.toContain('placeholder="silver-900"')
    expect(markup).not.toContain('placeholder="Silver (.900)"')
  })
})
