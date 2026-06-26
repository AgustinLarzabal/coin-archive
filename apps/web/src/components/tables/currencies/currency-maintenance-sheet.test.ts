import type { CurrencyOption } from "@workspace/db"
import { createElement } from "react"
import type { ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { CURRENCY_DELETE_REASSIGN_REQUIRED_MESSAGE } from "@/lib/currency-maintenance"

import { CURRENCY_DELETE_CONFIRMATION_DESCRIPTION } from "./currency-maintenance-sheet"
import { CurrencyMaintenanceSheet } from "./currency-maintenance-sheet"

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
  Sheet: ({
    children,
    open,
  }: {
    children: ReactNode
    open: boolean
  }) => (open ? createElement("div", null, children) : null),
  SheetContent: ({ children }: { children: ReactNode }) =>
    createElement("div", null, children),
  SheetHeader: ({ children }: { children: ReactNode }) =>
    createElement("div", null, children),
  SheetTitle: ({ children }: { children: ReactNode }) =>
    createElement("h1", null, children),
}))

vi.mock("@workspace/ui/components/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: ReactNode }) =>
    createElement("div", null, children),
  DropdownMenuContent: ({ children }: { children: ReactNode }) =>
    createElement("div", null, children),
  DropdownMenuItem: ({
    children,
  }: {
    children: ReactNode
  }) => createElement("button", null, children),
  DropdownMenuTrigger: ({ children }: { children: ReactNode }) =>
    createElement("button", null, children),
}))

vi.mock("@workspace/ui/components/alert-dialog", () => ({
  AlertDialog: ({ children }: { children: ReactNode }) =>
    createElement("div", null, children),
  AlertDialogAction: ({ children }: { children: ReactNode }) =>
    createElement("button", null, children),
  AlertDialogCancel: ({ children }: { children: ReactNode }) =>
    createElement("button", null, children),
  AlertDialogContent: ({ children }: { children: ReactNode }) =>
    createElement("div", null, children),
  AlertDialogDescription: ({ children }: { children: ReactNode }) =>
    createElement("p", null, children),
  AlertDialogFooter: ({ children }: { children: ReactNode }) =>
    createElement("div", null, children),
  AlertDialogHeader: ({ children }: { children: ReactNode }) =>
    createElement("div", null, children),
  AlertDialogTitle: ({ children }: { children: ReactNode }) =>
    createElement("h2", null, children),
}))

vi.mock("@workspace/ui/components/button", () => ({
  Button: ({ children }: { children?: ReactNode }) =>
    createElement("button", null, children),
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
    const markup = renderToStaticMarkup(
      createElement(CurrencyMaintenanceSheet, {
        currency: null,
        open: true,
        onOpenChange: vi.fn(),
      })
    )

    expect(markup).toContain("Create Currency")
    expect(markup).toContain("CurrencyCreateForm")
    expect(markup).not.toContain("Delete Currency?")
  })

  it("renders the edit-sheet delete action and confirmation copy for an existing Currency", () => {
    const markup = renderToStaticMarkup(
      createElement(CurrencyMaintenanceSheet, {
        currency,
        open: true,
        onOpenChange: vi.fn(),
      })
    )

    expect(markup).toContain("Edit Currency")
    expect(markup).toContain("CurrencyEditForm")
    expect(markup).toContain(">Delete<")
    expect(markup).toContain("Delete Currency?")
    expect(markup).toContain(CURRENCY_DELETE_CONFIRMATION_DESCRIPTION)
    expect(markup).toContain(">Cancel<")
  })
})
