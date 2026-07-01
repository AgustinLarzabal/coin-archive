import { createElement } from "react"
import type { ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { IssuerMaintenanceSheet } from "./issuer-maintenance-sheet"

type MockComponentProps = {
  children?: ReactNode
}

type MockOpenComponentProps = MockComponentProps & {
  open: boolean
}

function createMockElement(tagName: string) {
  return function MockElement({ children }: MockComponentProps) {
    return createElement(tagName, null, children)
  }
}

function createOpenMockElement(tagName: string) {
  return function MockOpenElement({
    children,
    open,
  }: MockOpenComponentProps) {
    return open ? createElement(tagName, null, children) : null
  }
}

vi.mock("@workspace/ui/components/sheet", () => ({
  Sheet: createOpenMockElement("div"),
  SheetContent: createMockElement("div"),
  SheetHeader: createMockElement("div"),
  SheetTitle: createMockElement("h1"),
}))

vi.mock("./issuer-create-form", () => ({
  IssuerCreateForm: () => createElement("div", null, "IssuerCreateForm"),
}))

const issuers = [
  {
    id: "e7e2f318-84f5-4d7d-8dd1-eb6686c5db98",
    code: "argentine-republic",
    isoCode: "AR",
    name: "Argentine Republic",
    parent: null,
  },
] as const

describe("IssuerMaintenanceSheet", () => {
  it("renders create mode with the Issuer create form", () => {
    const markup = renderToStaticMarkup(
      createElement(IssuerMaintenanceSheet, {
        issuers: [...issuers],
        open: true,
        onOpenChange: vi.fn(),
      })
    )

    expect(markup).toContain("Create Issuer")
    expect(markup).toContain("IssuerCreateForm")
  })
})
