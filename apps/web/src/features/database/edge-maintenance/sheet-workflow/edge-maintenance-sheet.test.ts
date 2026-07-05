import type { EdgeOption } from "@workspace/db"
import { createElement } from "react"
import type { ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { EDGE_IN_USE_DELETE_ERROR } from "../actions"

import {
  EDGE_DELETE_CONFIRMATION_DESCRIPTION,
  EdgeMaintenanceSheet,
} from "./edge-maintenance-sheet"

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

vi.mock("../form-workflow/edge-create-form", () => ({
  EdgeCreateForm: () => createElement("div", null, "EdgeCreateForm"),
}))

vi.mock("../form-workflow/edge-edit-form", () => ({
  EdgeEditForm: () => createElement("div", null, "EdgeEditForm"),
}))

const edge: EdgeOption = {
  id: "eb80363e-d0dc-4a28-8a43-297fbd5d67fc",
  code: "reeded",
  name: "Reeded",
  createdAt: new Date("2026-06-24T12:00:00.000Z"),
  updatedAt: new Date("2026-06-24T12:00:00.000Z"),
}

function renderEdgeMaintenanceSheet(edgeOption: EdgeOption | null) {
  return renderToStaticMarkup(
    createElement(EdgeMaintenanceSheet, {
      edge: edgeOption,
      open: true,
      onOpenChange: vi.fn(),
    })
  )
}

describe("EDGE_DELETE_CONFIRMATION_DESCRIPTION", () => {
  it("explains the deletion is permanent and reuses the shared in-use guidance", () => {
    expect(EDGE_DELETE_CONFIRMATION_DESCRIPTION).toContain(
      "permanently deletes the Edge"
    )
    expect(EDGE_DELETE_CONFIRMATION_DESCRIPTION).toContain(
      EDGE_IN_USE_DELETE_ERROR.replace(
        "Edge cannot be deleted while Coins still use it. ",
        ""
      )
    )
  })
})

describe("EdgeMaintenanceSheet", () => {
  it("shows create mode without delete affordances when no Edge is selected", () => {
    const markup = renderEdgeMaintenanceSheet(null)

    expect(markup).toContain("Create Edge")
    expect(markup).toContain("EdgeCreateForm")
    expect(markup).not.toContain("Delete Edge?")
  })

  it("renders the edit-sheet delete action and confirmation copy for an existing Edge", () => {
    const markup = renderEdgeMaintenanceSheet(edge)

    expect(markup).toContain("Edit Edge")
    expect(markup).toContain("EdgeEditForm")
    expect(markup).toContain(">Delete<")
    expect(markup).toContain("Delete Edge?")
    expect(markup).toContain(EDGE_DELETE_CONFIRMATION_DESCRIPTION)
    expect(markup).toContain(">Cancel<")
  })
})
