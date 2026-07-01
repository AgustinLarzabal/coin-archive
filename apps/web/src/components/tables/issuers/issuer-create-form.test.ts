import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import {
  IssuerCreateForm,
  filterParentIssuerOptions,
  formatParentIssuerOptionLabel,
} from "./issuer-create-form"

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
    id: "e7e2f318-84f5-4d7d-8dd1-eb6686c5db98",
    code: "argentine-republic",
    isoCode: "AR",
    name: "Argentine Republic",
    parent: null,
  },
  {
    id: "6b772b22-b920-4253-9d6f-a4bcf950bf96",
    code: "provincia-de-la-rioja",
    isoCode: "AR",
    name: "Provincia de La Rioja",
    parent: {
      id: "e7e2f318-84f5-4d7d-8dd1-eb6686c5db98",
      code: "argentine-republic",
      name: "Argentine Republic",
    },
  },
] as const

function renderIssuerCreateForm() {
  return renderToStaticMarkup(
    createElement(IssuerCreateForm, {
      issuers: [...issuers],
    })
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

describe("formatParentIssuerOptionLabel", () => {
  it("includes parent context when an Issuer is grouped under another Issuer", () => {
    expect(formatParentIssuerOptionLabel(issuers[0])).toBe(
      "Argentine Republic (argentine-republic)"
    )
    expect(formatParentIssuerOptionLabel(issuers[1])).toBe(
      "Provincia de La Rioja (provincia-de-la-rioja) - Parent: Argentine Republic (argentine-republic)"
    )
  })
})

describe("filterParentIssuerOptions", () => {
  it("matches Issuers by child and parent context while trimming whitespace", () => {
    expect(filterParentIssuerOptions([...issuers], " rioja ")).toStrictEqual([
      issuers[1],
    ])
    expect(
      filterParentIssuerOptions([...issuers], "argentine-republic")
    ).toStrictEqual(issuers)
  })
})

describe("IssuerCreateForm", () => {
  it("renders explicit Issuer fields, the parent selector, and disables Create until the draft is complete", () => {
    const markup = renderIssuerCreateForm()

    expect(markup).toContain('id="database-issuer-create-form"')
    expect(markup).toContain("Issuer Code")
    expect(markup).toContain('placeholder="argentine-republic"')
    expect(markup).toContain("Issuer Name")
    expect(markup).toContain('placeholder="Argentine Republic"')
    expect(markup).toContain("Issuer ISO Code")
    expect(markup).toContain('placeholder="AR"')
    expect(markup).toContain("Parent Issuer")
    expect(markup).toContain("No Parent Issuer")
    expect(markup).toContain(
      "Search parent issuers by name, code, or parent context..."
    )
    expect(markup).toContain(">Create<")
    expect(markup).toContain('type="submit"')
    expect(markup).toContain('disabled=""')
  })
})
