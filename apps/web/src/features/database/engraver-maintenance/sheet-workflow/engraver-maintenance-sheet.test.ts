import type { Engraver } from "@coin-archive/api"
import { createElement } from "react"
import type { ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { ENGRAVER_IN_USE_DELETE_ERROR } from "../engraver-mutation-errors"

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

vi.mock("../form-workflow/engraver-create-form", () => ({
  EngraverCreateForm: () => createElement("div", null, "EngraverCreateForm"),
}))

vi.mock("../form-workflow/engraver-edit-form", () => ({
  EngraverEditForm: () => createElement("div", null, "EngraverEditForm"),
}))

const engraver: Engraver = {
  id: "eb80363e-d0dc-4a28-8a43-297fbd5d67fc",
  code: "reeded",
  name: "Reeded",
  version: 1,
  etag: '"engraver-version-1"',
  createdAt: "2026-06-24T12:00:00.000Z",
  updatedAt: "2026-06-24T12:00:00.000Z",
}

function renderEngraverMaintenanceSheet(engraverOption: Engraver | null) {
  return renderToStaticMarkup(
    createElement(EngraverMaintenanceSheet, {
      engraver: engraverOption,
      open: true,
      onOpenChange: vi.fn(),
    })
  )
}

describe("ENGRAVER_DELETE_CONFIRMATION_DESCRIPTION", () => {
  it("explains the deletion is permanent and reuses the shared in-use guidance", () => {
    expect(ENGRAVER_DELETE_CONFIRMATION_DESCRIPTION).toContain(
      "permanently deletes the Engraver"
    )
    expect(ENGRAVER_DELETE_CONFIRMATION_DESCRIPTION).toContain(
      ENGRAVER_IN_USE_DELETE_ERROR.replace(
        "Engraver cannot be deleted while Engraver Attributions still use it. ",
        ""
      )
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
    expect(markup).toContain(">Delete Engraver<")
    expect(markup).toContain("Delete Engraver?")
    expect(markup).toContain(ENGRAVER_DELETE_CONFIRMATION_DESCRIPTION)
    expect(markup).toContain(">Cancel<")
  })
})
