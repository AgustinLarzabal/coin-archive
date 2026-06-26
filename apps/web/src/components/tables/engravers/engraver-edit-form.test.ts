import type { EngraverOption } from "@workspace/db"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { vi } from "vitest"

import {
  EngraverEditForm,
  hasEngraverEditChanges,
} from "./engraver-edit-form"

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

const engraver: EngraverOption = {
  id: "0933c940-842f-42a6-bd41-e3a0d3d27e39",
  code: "barth",
  name: "Barth",
}

describe("hasEngraverEditChanges", () => {
  it("returns false when trimmed editable values match the current Engraver", () => {
    expect(
      hasEngraverEditChanges(engraver, {
        code: " barth ",
        name: " Barth ",
      })
    ).toBe(false)
  })

  it("returns true when any normalized editable field changed", () => {
    expect(
      hasEngraverEditChanges(engraver, {
        code: "durand",
        name: "Durand",
      })
    ).toBe(true)
  })
})

describe("EngraverEditForm", () => {
  it("renders explicit Engraver field labels with the current values and disables Save until something changed", () => {
    const markup = renderToStaticMarkup(
      createElement(EngraverEditForm, { engraver })
    )
    const expectedFields = [
      ["Engraver Code", 'value="barth"'],
      ["Engraver Name", 'value="Barth"'],
    ] as const

    for (const [label, value] of expectedFields) {
      expect(markup).toContain(label)
      expect(markup).toContain(value)
    }

    expect(markup).toContain('id="database-engraver-edit-form"')
    expect(markup).toContain(">Save<")
    expect(markup).toContain('type="submit"')
    expect(markup).toContain('disabled=""')
  })
})
