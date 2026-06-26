import type { EngraverOption } from "@workspace/db"
import { createElement } from "react"
import type { ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import {
  ENGRAVER_DELETE_CONFIRMATION_DESCRIPTION,
  EngraverMaintenanceSheet,
} from "./engraver-maintenance-sheet"

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

vi.mock("./engraver-create-form", () => ({
  EngraverCreateForm: () => createElement("div", null, "EngraverCreateForm"),
}))

vi.mock("./engraver-edit-form", () => ({
  EngraverEditForm: () => createElement("div", null, "EngraverEditForm"),
}))

const engraver: EngraverOption = {
  id: "84863d38-795b-443c-bd27-1dedb73c0fad",
  code: "barth",
  name: "Barth",
}

function renderEngraverMaintenanceSheet(engraverOption: EngraverOption | null) {
  return renderToStaticMarkup(
    createElement(EngraverMaintenanceSheet, {
      engraver: engraverOption,
      open: true,
      onOpenChange: vi.fn(),
    })
  )
}

describe("ENGRAVER_DELETE_CONFIRMATION_DESCRIPTION", () => {
  it("explains the deletion is permanent and that Engraver Attributions must be removed first", () => {
    expect(ENGRAVER_DELETE_CONFIRMATION_DESCRIPTION).toContain(
      "permanently deletes the Engraver"
    )
    expect(ENGRAVER_DELETE_CONFIRMATION_DESCRIPTION).toContain(
      "Existing Engraver Attributions"
    )
    expect(ENGRAVER_DELETE_CONFIRMATION_DESCRIPTION).toContain(
      "removed before the Engraver can be deleted"
    )
  })
})

describe("EngraverMaintenanceSheet", () => {
  it("shows create mode without delete affordances when no Engraver is selected", () => {
    const markup = renderEngraverMaintenanceSheet(null)

    expect(markup).toContain("Create Engraver")
    expect(markup).toContain("EngraverCreateForm")
    expect(markup).not.toContain("Delete Engraver?")
  })

  it("renders the edit-sheet delete action and confirmation copy for an existing Engraver", () => {
    const markup = renderEngraverMaintenanceSheet(engraver)

    expect(markup).toContain("Edit Engraver")
    expect(markup).toContain("EngraverEditForm")
    expect(markup).toContain(">Delete<")
    expect(markup).toContain("Delete Engraver?")
    expect(markup).toContain(ENGRAVER_DELETE_CONFIRMATION_DESCRIPTION)
    expect(markup).toContain(">Cancel<")
  })
})
