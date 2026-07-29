import type { OrientationOption } from "@coin-archive/db"
import { createElement } from "react"
import type { ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { ORIENTATION_IN_USE_DELETE_GUIDANCE } from "../actions"

import {
  ORIENTATION_DELETE_CONFIRMATION_DESCRIPTION,
  OrientationMaintenanceSheet,
} from "./orientation-maintenance-sheet"

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

vi.mock("../form-workflow/orientation-create-form", () => ({
  OrientationCreateForm: () => createElement("div", null, "OrientationCreateForm"),
}))

vi.mock("../form-workflow/orientation-edit-form", () => ({
  OrientationEditForm: () => createElement("div", null, "OrientationEditForm"),
}))

const orientation: OrientationOption = {
  id: "eb80363e-d0dc-4a28-8a43-297fbd5d67fc",
  code: "reeded",
  name: "Reeded",
  createdAt: new Date("2026-06-24T12:00:00.000Z"),
  updatedAt: new Date("2026-06-24T12:00:00.000Z"),
}

function renderOrientationMaintenanceSheet(orientationOption: OrientationOption | null) {
  return renderToStaticMarkup(
    createElement(OrientationMaintenanceSheet, {
      orientation: orientationOption,
      open: true,
      onOpenChange: vi.fn(),
    })
  )
}

describe("ORIENTATION_DELETE_CONFIRMATION_DESCRIPTION", () => {
  it("explains the deletion is permanent and reuses the shared in-use guidance", () => {
    expect(ORIENTATION_DELETE_CONFIRMATION_DESCRIPTION).toContain(
      "permanently deletes the Orientation"
    )
    expect(ORIENTATION_DELETE_CONFIRMATION_DESCRIPTION).toContain(
      ORIENTATION_IN_USE_DELETE_GUIDANCE
    )
  })
})

describe("OrientationMaintenanceSheet", () => {
  it("shows create mode without delete affordances when no Orientation is selected", () => {
    const markup = renderOrientationMaintenanceSheet(null)

    expect(markup).toContain("Create Orientation")
    expect(markup).toContain("OrientationCreateForm")
    expect(markup).not.toContain("Delete Orientation?")
  })

  it("renders the edit-sheet delete action and confirmation copy for an existing Orientation", () => {
    const markup = renderOrientationMaintenanceSheet(orientation)

    expect(markup).toContain("Edit Orientation")
    expect(markup).toContain("OrientationEditForm")
    expect(markup).toContain(">Delete<")
    expect(markup).toContain("Delete Orientation?")
    expect(markup).toContain(ORIENTATION_DELETE_CONFIRMATION_DESCRIPTION)
    expect(markup).toContain(">Cancel<")
  })
})
