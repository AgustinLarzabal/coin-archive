import type { RulerGroupOption, RulerOption } from "@workspace/db"
import { createElement } from "react"
import type { ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { RULER_IN_USE_DELETE_GUIDANCE } from "../actions"

import {
  RULER_DELETE_CONFIRMATION_DESCRIPTION,
  RulerMaintenanceSheet,
} from "./ruler-maintenance-sheet"

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

vi.mock("@workspace/ui/components/sheet", () => ({
  Sheet: createOpenMockElement("div"),
  SheetContent: createMockElement("div"),
  SheetHeader: createMockElement("div"),
  SheetTitle: createMockElement("h1"),
}))

vi.mock("@workspace/ui/components/dropdown-menu", () => ({
  DropdownMenu: createMockElement("div"),
  DropdownMenuContent: createMockElement("div"),
  DropdownMenuItem: createMockElement("button"),
  DropdownMenuTrigger: createMockElement("button"),
}))

vi.mock("@workspace/ui/components/alert-dialog", () => ({
  AlertDialog: createMockElement("div"),
  AlertDialogAction: createMockElement("button"),
  AlertDialogCancel: createMockElement("button"),
  AlertDialogContent: createMockElement("div"),
  AlertDialogDescription: createMockElement("p"),
  AlertDialogFooter: createMockElement("div"),
  AlertDialogHeader: createMockElement("div"),
  AlertDialogTitle: createMockElement("h2"),
}))

vi.mock("@workspace/ui/components/button", () => ({
  Button: createMockElement("button"),
}))

vi.mock("@/components/icons", () => ({
  Icons: {
    MoreVertical: () => createElement("span", null, "MoreVertical"),
  },
}))

vi.mock("../form-workflow/ruler-create-form", () => ({
  RulerCreateForm: () => createElement("div", null, "RulerCreateForm"),
}))

vi.mock("../form-workflow/ruler-edit-form", () => ({
  RulerEditForm: () => createElement("div", null, "RulerEditForm"),
}))

const rulerGroups: RulerGroupOption[] = [
  {
    id: "6f18a1db-9096-433b-b3f1-906c772f7a29",
    code: "house-of-bourbon",
    name: "House of Bourbon",
    createdAt: new Date("2026-07-01T00:00:00.000Z"),
    updatedAt: new Date("2026-07-01T00:00:00.000Z"),
  },
]

const ruler: RulerOption = {
  id: "2f0b5ff0-f4a9-4333-8f6d-dad19cd8510b",
  code: "felipe-v",
  name: "Felipe V",
  group: {
    id: rulerGroups[0].id,
    code: rulerGroups[0].code,
    name: rulerGroups[0].name,
  },
}

function renderRulerMaintenanceSheet(rulerOption: RulerOption | null) {
  return renderToStaticMarkup(
    createElement(RulerMaintenanceSheet, {
      ruler: rulerOption,
      rulerGroups,
      open: true,
      onOpenChange: vi.fn(),
    })
  )
}

describe("RULER_DELETE_CONFIRMATION_DESCRIPTION", () => {
  it("explains the deletion is permanent and reuses the shared in-use guidance", () => {
    expect(RULER_DELETE_CONFIRMATION_DESCRIPTION).toContain(
      "permanently deletes the Ruler"
    )
    expect(RULER_DELETE_CONFIRMATION_DESCRIPTION).toContain(
      RULER_IN_USE_DELETE_GUIDANCE
    )
  })
})

describe("RulerMaintenanceSheet", () => {
  it("shows create mode without delete affordances when no Ruler is selected", () => {
    const markup = renderRulerMaintenanceSheet(null)

    expect(markup).toContain("Create Ruler")
    expect(markup).toContain("RulerCreateForm")
    expect(markup).not.toContain("Delete Ruler?")
  })

  it("renders the edit-sheet delete action and confirmation copy for an existing Ruler", () => {
    const markup = renderRulerMaintenanceSheet(ruler)

    expect(markup).toContain("Edit Ruler")
    expect(markup).toContain("RulerEditForm")
    expect(markup).toContain(">Delete<")
    expect(markup).toContain("Delete Ruler?")
    expect(markup).toContain(RULER_DELETE_CONFIRMATION_DESCRIPTION)
    expect(markup).toContain(">Cancel<")
  })
})
