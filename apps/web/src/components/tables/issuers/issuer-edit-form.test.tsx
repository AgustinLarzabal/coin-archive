import type { IssuerMaintenanceRecord } from "@workspace/db"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { hasIssuerEditChanges, IssuerEditForm } from "./issuer-edit-form"

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

const issuers: IssuerMaintenanceRecord[] = [
  {
    id: "dc2f4da3-cfd0-43fa-8900-7a384fc6977a",
    code: "argentine-republic",
    isoCode: "AR",
    name: "Argentine Republic",
    parent: null,
  },
  {
    id: "4ffdfab6-989a-4378-ba8c-3610de04b3ef",
    code: "provincia-de-la-rioja",
    isoCode: "AR",
    name: "Provincia de La Rioja",
    parent: {
      id: "dc2f4da3-cfd0-43fa-8900-7a384fc6977a",
      code: "argentine-republic",
      name: "Argentine Republic",
    },
  },
]

describe("hasIssuerEditChanges", () => {
  it("returns false when trimmed editable values match the current Issuer", () => {
    expect(
      hasIssuerEditChanges(issuers[1], issuers, {
        code: " provincia-de-la-rioja ",
        isoCode: " ar ",
        name: " Provincia de La Rioja ",
        parentIssuerLabel: " Argentine Republic (argentine-republic) ",
      })
    ).toBe(false)
  })

  it("returns true when any normalized editable field changed", () => {
    expect(
      hasIssuerEditChanges(issuers[1], issuers, {
        code: "la-rioja",
        isoCode: "AR",
        name: "La Rioja",
        parentIssuerLabel: "",
      })
    ).toBe(true)
  })
})

describe("IssuerEditForm", () => {
  it("renders explicit Issuer field labels with the current values and disables Save until something changed", () => {
    const markup = renderToStaticMarkup(
      createElement(IssuerEditForm, {
        issuer: issuers[1],
        issuers,
      })
    )
    const expectedFields = [
      ["Issuer Code", 'value="provincia-de-la-rioja"'],
      ["Issuer Name", 'value="Provincia de La Rioja"'],
      ["Issuer ISO Code", 'value="AR"'],
      ["Parent Issuer", 'value="Argentine Republic (argentine-republic)"'],
    ] as const

    for (const [label, value] of expectedFields) {
      expect(markup).toContain(label)
      expect(markup).toContain(value)
    }

    expect(markup).toContain('id="database-issuer-edit-form"')
    expect(markup).toContain(">Save<")
    expect(markup).toContain('type="submit"')
    expect(markup).toContain('disabled=""')
  })
})
