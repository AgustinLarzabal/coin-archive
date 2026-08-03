import type { Rim } from "@coin-archive/api"
import { createElement } from "react"
import type { ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { RIM_IN_USE_DELETE_ERROR } from "../rim-mutation-errors"

import {
  RIM_DELETE_CONFIRMATION_DESCRIPTION,
  RimMaintenanceSheet,
} from "./rim-maintenance-sheet"

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

vi.mock("../form-workflow/rim-create-form", () => ({
  RimCreateForm: () => createElement("div", null, "RimCreateForm"),
}))

vi.mock("../form-workflow/rim-edit-form", () => ({
  RimEditForm: () => createElement("div", null, "RimEditForm"),
}))

const rim: Rim = {
  id: "eb80363e-d0dc-4a28-8a43-297fbd5d67fc",
  code: "reeded",
  name: "Reeded",
  version: 1,
  etag: '"rim-version-1"',
  createdAt: "2026-06-24T12:00:00.000Z",
  updatedAt: "2026-06-24T12:00:00.000Z",
}

function renderRimMaintenanceSheet(rimOption: Rim | null) {
  return renderToStaticMarkup(
    createElement(RimMaintenanceSheet, {
      rim: rimOption,
      open: true,
      onOpenChange: vi.fn(),
    })
  )
}

describe("RIM_DELETE_CONFIRMATION_DESCRIPTION", () => {
  it("explains the deletion is permanent and reuses the shared in-use guidance", () => {
    expect(RIM_DELETE_CONFIRMATION_DESCRIPTION).toContain(
      "permanently deletes the Rim"
    )
    expect(RIM_DELETE_CONFIRMATION_DESCRIPTION).toContain(
      RIM_IN_USE_DELETE_ERROR.replace(
        "Rim cannot be deleted while Coins still use it. ",
        ""
      )
    )
  })
})

describe("RimMaintenanceSheet", () => {
  it("shows create mode without delete affordances when no Rim is selected", () => {
    const markup = renderRimMaintenanceSheet(null)

    expect(markup).toContain("Create Rim")
    expect(markup).toContain("RimCreateForm")
    expect(markup).not.toContain("Delete Rim?")
  })

  it("renders the edit-sheet delete action and confirmation copy for an existing Rim", () => {
    const markup = renderRimMaintenanceSheet(rim)

    expect(markup).toContain("Edit Rim")
    expect(markup).toContain("RimEditForm")
    expect(markup).toContain(">Delete<")
    expect(markup).toContain("Delete Rim?")
    expect(markup).toContain(RIM_DELETE_CONFIRMATION_DESCRIPTION)
    expect(markup).toContain(">Cancel<")
  })
})
