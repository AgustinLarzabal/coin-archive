import type { DistributionOption } from "@workspace/db"
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

vi.mock("./distribution-edit-form", () => ({
  DistributionEditForm: () => createElement("div", null, "DistributionEditForm"),
}))

const distribution: DistributionOption = {
  id: "84863d38-795b-443c-bd27-1dedb73c0fad",
  code: "standard-circulation",
  name: "Standard circulation",
}

describe("DistributionMaintenanceSheet", () => {
  it("renders create mode with the Distribution create form", () => {
    const markup = renderToStaticMarkup(
      createElement(DistributionMaintenanceSheet, {
        distribution: null,
        open: true,
        onOpenChange: vi.fn(),
      })
    )

    expect(markup).toContain("Create Distribution")
    expect(markup).toContain("DistributionCreateForm")
  })

  it("renders edit mode with the Distribution edit form for an existing Distribution", () => {
    const markup = renderToStaticMarkup(
      createElement(DistributionMaintenanceSheet, {
        distribution,
        open: true,
        onOpenChange: vi.fn(),
      })
    )

    expect(markup).toContain("Edit Distribution")
    expect(markup).toContain("DistributionEditForm")
  })
})
