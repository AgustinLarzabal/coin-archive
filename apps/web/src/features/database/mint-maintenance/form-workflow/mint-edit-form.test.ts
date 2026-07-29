import type { MintOption } from "@coin-archive/db"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { MintEditForm, hasMintEditChanges } from "./mint-edit-form"

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

function renderMintEditForm(mintOption: MintOption) {
  return renderToStaticMarkup(
    createElement(MintEditForm, { mint: mintOption })
  )
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

const mint: MintOption = {
  id: "0933c940-842f-42a6-bd41-e3a0d3d27e39",
  code: "buenos-aires-mint",
  name: "Buenos Aires Mint",
  createdAt: new Date("2026-07-01T00:00:00.000Z"),
  updatedAt: new Date("2026-07-01T00:00:00.000Z"),
}

describe("hasMintEditChanges", () => {
  it("returns false when trimmed editable values match the current Mint", () => {
    expect(
      hasMintEditChanges(mint, {
        code: " buenos-aires-mint ",
        name: " Buenos Aires Mint ",
      })
    ).toBe(false)
  })

  it("returns true when any normalized editable field changed", () => {
    expect(
      hasMintEditChanges(mint, {
        code: "royal-mint-of-madrid",
        name: "Royal Mint of Madrid",
      })
    ).toBe(true)
  })
})

describe("MintEditForm", () => {
  it("renders explicit Mint field labels with the current values and disables Save until something changed", () => {
    const markup = renderMintEditForm(mint)
    const expectedFields = [
      ["Mint Code", 'value="buenos-aires-mint"'],
      ["Mint Name", 'value="Buenos Aires Mint"'],
    ] as const

    for (const [label, value] of expectedFields) {
      expect(markup).toContain(label)
      expect(markup).toContain(value)
    }

    expect(markup).toContain('id="database-mint-edit-form"')
    expect(markup).toContain(">Save<")
    expect(markup).toContain('type="submit"')
    expect(markup).toContain('disabled=""')
  })
})
