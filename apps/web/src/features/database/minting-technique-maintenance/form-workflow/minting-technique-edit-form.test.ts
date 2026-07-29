import type { TechniqueOption } from "@coin-archive/db"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import {
  hasMintingTechniqueEditChanges,
  MintingTechniqueEditForm,
} from "./minting-technique-edit-form"

const mintingTechnique: TechniqueOption = {
  id: "8bfd8928-cd58-4a23-b13c-969be89f4d88",
  code: "hammered",
  name: "Hammered",
  createdAt: new Date("2026-07-02T00:00:00.000Z"),
  updatedAt: new Date("2026-07-02T00:00:00.000Z"),
}

vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({
    invalidate: vi.fn(),
  }),
}))

vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => ({
    inputValidator() {
      return this
    },
    handler() {
      return {}
    },
  }),
  useServerFn: () => vi.fn(),
}))

describe("hasMintingTechniqueEditChanges", () => {
  it("returns false when trimmed editable values match the current Minting Technique", () => {
    expect(
      hasMintingTechniqueEditChanges(mintingTechnique, {
        code: " hammered ",
        name: " Hammered ",
      })
    ).toBe(false)
  })

  it("returns true when any normalized editable field changed", () => {
    expect(
      hasMintingTechniqueEditChanges(mintingTechnique, {
        code: "machine-struck",
        name: "Machine struck",
      })
    ).toBe(true)
  })
})

describe("MintingTechniqueEditForm", () => {
  it("renders explicit Minting Technique field labels with the current values and disables Save until something changed", () => {
    const markup = renderToStaticMarkup(
      createElement(MintingTechniqueEditForm, { mintingTechnique })
    )
    const expectedFields = [
      ["Minting Technique Code", 'value="hammered"'],
      ["Minting Technique Name", 'value="Hammered"'],
    ] as const

    for (const [label, value] of expectedFields) {
      expect(markup).toContain(label)
      expect(markup).toContain(value)
    }

    expect(markup).toContain(">Save<")
    expect(markup).toContain('type="submit"')
    expect(markup).toContain('disabled=""')
  })
})
