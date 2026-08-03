import type { Shape } from "@coin-archive/api"
import { createElement } from "react"
import type { ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { SHAPE_IN_USE_DELETE_ERROR } from "../shape-mutation-errors"

import {
  SHAPE_DELETE_CONFIRMATION_DESCRIPTION,
  ShapeMaintenanceSheet,
} from "./shape-maintenance-sheet"

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

vi.mock("../form-workflow/shape-create-form", () => ({
  ShapeCreateForm: () => createElement("div", null, "ShapeCreateForm"),
}))

vi.mock("../form-workflow/shape-edit-form", () => ({
  ShapeEditForm: () => createElement("div", null, "ShapeEditForm"),
}))

const shape: Shape = {
  id: "eb80363e-d0dc-4a28-8a43-297fbd5d67fc",
  code: "reeded",
  name: "Reeded",
  version: 1,
  etag: '"shape-version-1"',
  createdAt: "2026-06-24T12:00:00.000Z",
  updatedAt: "2026-06-24T12:00:00.000Z",
}

function renderShapeMaintenanceSheet(shapeOption: Shape | null) {
  return renderToStaticMarkup(
    createElement(ShapeMaintenanceSheet, {
      shape: shapeOption,
      open: true,
      onOpenChange: vi.fn(),
    })
  )
}

describe("SHAPE_DELETE_CONFIRMATION_DESCRIPTION", () => {
  it("explains the deletion is permanent and reuses the shared in-use guidance", () => {
    expect(SHAPE_DELETE_CONFIRMATION_DESCRIPTION).toContain(
      "permanently deletes the Shape"
    )
    expect(SHAPE_DELETE_CONFIRMATION_DESCRIPTION).toContain(
      SHAPE_IN_USE_DELETE_ERROR.replace(
        "Shape cannot be deleted while Coins still use it. ",
        ""
      )
    )
  })
})

describe("ShapeMaintenanceSheet", () => {
  it("shows create mode without delete affordances when no Shape is selected", () => {
    const markup = renderShapeMaintenanceSheet(null)

    expect(markup).toContain("Create Shape")
    expect(markup).toContain("ShapeCreateForm")
    expect(markup).not.toContain("Delete Shape?")
  })

  it("renders the edit-sheet delete action and confirmation copy for an existing Shape", () => {
    const markup = renderShapeMaintenanceSheet(shape)

    expect(markup).toContain("Edit Shape")
    expect(markup).toContain("ShapeEditForm")
    expect(markup).toContain(">Delete<")
    expect(markup).toContain("Delete Shape?")
    expect(markup).toContain(SHAPE_DELETE_CONFIRMATION_DESCRIPTION)
    expect(markup).toContain(">Cancel<")
  })
})
