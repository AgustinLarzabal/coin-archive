import type { IssuerMaintenanceRecord } from "../issuer-maintenance-route-data"
import { createElement } from "react"
import type { ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import {
  ISSUER_DELETE_CONFIRMATION_DESCRIPTION,
  IssuerMaintenanceSheet,
} from "./issuer-maintenance-sheet"

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

vi.mock("../form-workflow/issuer-create-form", () => ({
  IssuerCreateForm: () => createElement("div", null, "IssuerCreateForm"),
}))

vi.mock("../form-workflow/issuer-edit-form", () => ({
  IssuerEditForm: () => createElement("div", null, "IssuerEditForm"),
}))

const issuers: IssuerMaintenanceRecord[] = [
  {
    id: "dc2f4da3-cfd0-43fa-8900-7a384fc6977a",
    code: "argentine-republic",
    isoCode: "AR",
    name: "Argentine Republic",
    etag: '"issuer-version"',
    parent: null,
  },
]

function renderIssuerMaintenanceSheet(
  issuerOption: IssuerMaintenanceRecord | null
) {
  return renderToStaticMarkup(
    createElement(IssuerMaintenanceSheet, {
      issuer: issuerOption,
      issuers,
      open: true,
      onOpenChange: vi.fn(),
    })
  )
}

describe("IssuerMaintenanceSheet", () => {
  it("shows create mode without delete affordances when no Issuer is selected", () => {
    const markup = renderIssuerMaintenanceSheet(null)

    expect(markup).toContain("Create Issuer")
    expect(markup).toContain("IssuerCreateForm")
    expect(markup).not.toContain("Delete Issuer?")
  })

  it("renders the edit-sheet delete action and confirmation copy for an existing Issuer", () => {
    const markup = renderIssuerMaintenanceSheet(issuers[0])

    expect(markup).toContain("Edit Issuer")
    expect(markup).toContain("IssuerEditForm")
    expect(markup).toContain(">Delete Issuer<")
    expect(markup).toContain("Delete Issuer?")
    expect(markup).toContain(ISSUER_DELETE_CONFIRMATION_DESCRIPTION)
    expect(markup).toContain(">Cancel<")
  })
})
