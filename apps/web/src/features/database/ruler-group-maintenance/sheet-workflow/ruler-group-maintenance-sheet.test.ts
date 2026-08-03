import type { RulerGroup } from "@coin-archive/api"
import { createElement } from "react"
import type { ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { RULER_GROUP_IN_USE_DELETE_ERROR } from "../ruler-group-mutation-errors"

import {
  RULER_GROUP_DELETE_CONFIRMATION_DESCRIPTION,
  RulerGroupMaintenanceSheet,
} from "./ruler-group-maintenance-sheet"

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
  return function MockOpenElement({ children, open }: MockOpenComponentProps) {
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

vi.mock("@coin-archive/ui/components/sheet", () => ({
  Sheet: createOpenMockElement("div"),
  SheetContent: createMockElement("div"),
  SheetHeader: createMockElement("div"),
  SheetTitle: createMockElement("h1"),
}))

vi.mock("@coin-archive/ui/components/dropdown-menu", () => ({
  DropdownMenu: createMockElement("div"),
  DropdownMenuContent: createMockElement("div"),
  DropdownMenuItem: createMockElement("button"),
  DropdownMenuTrigger: createMockElement("button"),
}))

vi.mock("@coin-archive/ui/components/alert-dialog", () => ({
  AlertDialog: createMockElement("div"),
  AlertDialogAction: createMockElement("button"),
  AlertDialogCancel: createMockElement("button"),
  AlertDialogContent: createMockElement("div"),
  AlertDialogDescription: createMockElement("p"),
  AlertDialogFooter: createMockElement("div"),
  AlertDialogHeader: createMockElement("div"),
  AlertDialogTitle: createMockElement("h2"),
}))

vi.mock("@coin-archive/ui/components/button", () => ({
  Button: createMockElement("button"),
}))

vi.mock("@/components/icons", () => ({
  Icons: {
    MoreVertical: () => createElement("span", null, "MoreVertical"),
  },
}))

vi.mock("../form-workflow/ruler-group-create-form", () => ({
  RulerGroupCreateForm: () =>
    createElement("div", null, "RulerGroupCreateForm"),
}))

vi.mock("../form-workflow/ruler-group-edit-form", () => ({
  RulerGroupEditForm: () => createElement("div", null, "RulerGroupEditForm"),
}))

const rulerGroup: RulerGroup = {
  id: "eb80363e-d0dc-4a28-8a43-297fbd5d67fc",
  code: "reeded",
  name: "Reeded",
  version: 1,
  etag: '"ruler-group-version-1"',
  createdAt: "2026-06-24T12:00:00.000Z",
  updatedAt: "2026-06-24T12:00:00.000Z",
}

function renderRulerGroupMaintenanceSheet(rulerGroupOption: RulerGroup | null) {
  return renderToStaticMarkup(
    createElement(RulerGroupMaintenanceSheet, {
      rulerGroup: rulerGroupOption,
      open: true,
      onOpenChange: vi.fn(),
    })
  )
}

describe("RULER_GROUP_DELETE_CONFIRMATION_DESCRIPTION", () => {
  it("explains the deletion is permanent and reuses the shared in-use guidance", () => {
    expect(RULER_GROUP_DELETE_CONFIRMATION_DESCRIPTION).toContain(
      "permanently deletes the Ruler Group"
    )
    expect(RULER_GROUP_DELETE_CONFIRMATION_DESCRIPTION).toContain(
      RULER_GROUP_IN_USE_DELETE_ERROR.replace(
        "Ruler Group cannot be deleted while Rulers still belong to it. ",
        ""
      )
    )
  })
})

describe("RulerGroupMaintenanceSheet", () => {
  it("shows create mode without delete affordances when no Ruler Group is selected", () => {
    const markup = renderRulerGroupMaintenanceSheet(null)

    expect(markup).toContain("Create Ruler Group")
    expect(markup).toContain("RulerGroupCreateForm")
    expect(markup).not.toContain("Delete Ruler Group?")
  })

  it("renders the edit-sheet delete action and confirmation copy for an existing RulerGroup", () => {
    const markup = renderRulerGroupMaintenanceSheet(rulerGroup)

    expect(markup).toContain("Edit Ruler Group")
    expect(markup).toContain("RulerGroupEditForm")
    expect(markup).toContain(">Delete<")
    expect(markup).toContain("Delete Ruler Group?")
    expect(markup).toContain(RULER_GROUP_DELETE_CONFIRMATION_DESCRIPTION)
    expect(markup).toContain(">Cancel<")
  })
})
