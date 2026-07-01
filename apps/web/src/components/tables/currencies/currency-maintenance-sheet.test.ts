import type { CurrencyOption } from "@workspace/db"
import { createElement } from "react"
import type { ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { CURRENCY_DELETE_REASSIGN_REQUIRED_MESSAGE } from "@/lib/currency-maintenance"

import { CURRENCY_DELETE_CONFIRMATION_DESCRIPTION, CurrencyMaintenanceSheet  } from "./currency-maintenance-sheet"

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

vi.mock("./currency-create-form", () => ({
  CurrencyCreateForm: () => createElement("div", null, "CurrencyCreateForm"),
}))

vi.mock("./currency-edit-form", () => ({
  CurrencyEditForm: () => createElement("div", null, "CurrencyEditForm"),
}))

const currency: CurrencyOption = {
  id: "0933c940-842f-42a6-bd41-e3a0d3d27e39",
  code: "united-states-dollar",
  name: "Dollar",
  fullName: "United States dollar",
  createdAt: new Date("2026-06-26T00:00:00.000Z"),
  updatedAt: new Date("2026-06-26T00:00:00.000Z"),
}

function renderCurrencyMaintenanceSheet(currencyOption: CurrencyOption | null) {
  return renderToStaticMarkup(
    createElement(CurrencyMaintenanceSheet, {
      currency: currencyOption,
      open: true,
      onOpenChange: vi.fn(),
    })
  )
}

describe("CURRENCY_DELETE_CONFIRMATION_DESCRIPTION", () => {
  it("explains the deletion is permanent and reuses the shared reassignment rule", () => {
    expect(CURRENCY_DELETE_CONFIRMATION_DESCRIPTION).toContain(
      "permanently deletes the Currency"
    )
    expect(CURRENCY_DELETE_CONFIRMATION_DESCRIPTION).toContain("existing Coins")
    expect(CURRENCY_DELETE_CONFIRMATION_DESCRIPTION).toContain(
      CURRENCY_DELETE_REASSIGN_REQUIRED_MESSAGE.replace(
        "those Coins",
        "existing Coins"
      )
    )
  })
})

describe("CurrencyMaintenanceSheet", () => {
  it("shows create mode without delete affordances when no Currency is selected", () => {
    const markup = renderCurrencyMaintenanceSheet(null)

    expect(markup).toContain("Create Currency")
    expect(markup).toContain("CurrencyCreateForm")
    expect(markup).not.toContain("Delete Currency?")
  })

  it("renders the edit-sheet delete action and confirmation copy for an existing Currency", () => {
    const markup = renderCurrencyMaintenanceSheet(currency)

    expect(markup).toContain("Edit Currency")
    expect(markup).toContain("CurrencyEditForm")
    expect(markup).toContain(">Delete<")
    expect(markup).toContain("Delete Currency?")
    expect(markup).toContain(CURRENCY_DELETE_CONFIRMATION_DESCRIPTION)
    expect(markup).toContain(">Cancel<")
  })
})
