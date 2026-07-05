import type { ThemeOption } from "@workspace/db"
import { createElement } from "react"
import type { ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { THEME_IN_USE_DELETE_GUIDANCE } from "../actions"

import {
  ThemeMaintenanceSheet,
  THEME_DELETE_CONFIRMATION_DESCRIPTION,
} from "./theme-maintenance-sheet"

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

vi.mock("../form-workflow/theme-create-form", () => ({
  ThemeCreateForm: ({
    onCreated,
  }: {
    onCreated?: (message: string) => void
  }) =>
    createElement(
      "div",
      null,
      onCreated ? "ThemeCreateForm:onCreated" : "ThemeCreateForm"
    ),
}))

vi.mock("../form-workflow/theme-edit-form", () => ({
  ThemeEditForm: ({
    onSaved,
  }: {
    onSaved?: (message: string) => void
  }) =>
    createElement(
      "div",
      null,
      onSaved ? "ThemeEditForm:onSaved" : "ThemeEditForm"
    ),
}))

const theme: ThemeOption = {
  id: "8bfd8928-cd58-4a23-b13c-969be89f4d88",
  code: "map",
  name: "Map",
}

function renderThemeMaintenanceSheet(themeOption: ThemeOption | null) {
  return renderToStaticMarkup(
    createElement(ThemeMaintenanceSheet, {
      theme: themeOption,
      open: true,
      onOpenChange: vi.fn(),
    })
  )
}

describe("THEME_DELETE_CONFIRMATION_DESCRIPTION", () => {
  it("explains the deletion is permanent and reuses the shared in-use guidance", () => {
    expect(THEME_DELETE_CONFIRMATION_DESCRIPTION).toContain(
      "permanently deletes the Theme"
    )
    expect(THEME_DELETE_CONFIRMATION_DESCRIPTION).toContain(
      THEME_IN_USE_DELETE_GUIDANCE
    )
  })
})

describe("ThemeMaintenanceSheet", () => {
  it("shows create mode without delete affordances when no Theme is selected", () => {
    const markup = renderThemeMaintenanceSheet(null)

    expect(markup).toContain("Create Theme")
    expect(markup).toContain("ThemeCreateForm:onCreated")
    expect(markup).not.toContain("Delete Theme?")
  })

  it("renders the edit-sheet delete action and confirmation copy for an existing Theme", () => {
    const markup = renderThemeMaintenanceSheet(theme)

    expect(markup).toContain("Edit Theme")
    expect(markup).toContain("ThemeEditForm:onSaved")
    expect(markup).toContain(">Delete<")
    expect(markup).toContain("Delete Theme?")
    expect(markup).toContain(THEME_DELETE_CONFIRMATION_DESCRIPTION)
    expect(markup).toContain(">Cancel<")
  })
})
