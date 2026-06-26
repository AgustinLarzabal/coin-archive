import { createElement } from "react"
import type { ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { DistributionMaintenanceSheet } from "./distribution-maintenance-sheet"

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

vi.mock("./distribution-create-form", () => ({
  DistributionCreateForm: () =>
    createElement("div", null, "DistributionCreateForm"),
}))

describe("DistributionMaintenanceSheet", () => {
  it("renders create mode with the Distribution create form", () => {
    const markup = renderToStaticMarkup(
      createElement(DistributionMaintenanceSheet, {
        open: true,
        onOpenChange: vi.fn(),
      })
    )

    expect(markup).toContain("Create Distribution")
    expect(markup).toContain("DistributionCreateForm")
  })
})
