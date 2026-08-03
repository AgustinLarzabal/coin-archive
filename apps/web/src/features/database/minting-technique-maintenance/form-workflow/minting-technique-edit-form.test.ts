import type { MintingTechnique } from "@coin-archive/api"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { MintingTechniqueEditForm } from "./minting-technique-edit-form"
import { hasMintingTechniqueEditChanges } from "./minting-technique-form.shared"

const mintingTechnique: MintingTechnique = {
  id: "eb80363e-d0dc-4a28-8a43-297fbd5d67fc",
  code: "reeded",
  name: "Reeded",
  version: 1,
  etag: '"minting-technique-version-1"',
  createdAt: "2026-06-24T12:00:00.000Z",
  updatedAt: "2026-06-24T12:00:00.000Z",
}

describe("hasMintingTechniqueEditChanges", () => {
  it("returns false when trimmed editable values match the current MintingTechnique", () => {
    expect(
      hasMintingTechniqueEditChanges(mintingTechnique, {
        code: " reeded ",
        name: " Reeded ",
      })
    ).toBe(false)
  })

  it("returns true when any normalized editable field changed", () => {
    expect(
      hasMintingTechniqueEditChanges(mintingTechnique, {
        code: "plain",
        name: "Plain",
      })
    ).toBe(true)
  })
})

describe("MintingTechniqueEditForm", () => {
  it("renders explicit MintingTechnique field labels with the current values and disables Save until something changed", () => {
    const markup = renderToStaticMarkup(
      createElement(MintingTechniqueEditForm, { mintingTechnique })
    )
    const expectedFields = [
      ["Minting Technique Code", 'value="reeded"'],
      ["Minting Technique Name", 'value="Reeded"'],
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
