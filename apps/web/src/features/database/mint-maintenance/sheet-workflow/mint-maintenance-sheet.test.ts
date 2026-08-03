import type { Mint } from "@coin-archive/api"
import { createElement } from "react"
import type { ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { MINT_DELETE_REASSIGN_REQUIRED_MESSAGE } from "../messages"

import {
  MINT_DELETE_CONFIRMATION_DESCRIPTION,
  MintMaintenanceSheet,
} from "./mint-maintenance-sheet"

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

vi.mock("../form-workflow/mint-create-form", () => ({
  MintCreateForm: () => createElement("div", null, "MintCreateForm"),
}))

vi.mock("../form-workflow/mint-edit-form", () => ({
  MintEditForm: () => createElement("div", null, "MintEditForm"),
}))

const mint: Mint = {
  id: "eb80363e-d0dc-4a28-8a43-297fbd5d67fc",
  code: "reeded",
  name: "Reeded",
  version: 1,
  etag: '"mint-version-1"',
  createdAt: "2026-06-24T12:00:00.000Z",
  updatedAt: "2026-06-24T12:00:00.000Z",
}

function renderMintMaintenanceSheet(mintOption: Mint | null) {
  return renderToStaticMarkup(
    createElement(MintMaintenanceSheet, {
      mint: mintOption,
      open: true,
      onOpenChange: vi.fn(),
    })
  )
}

describe("MINT_DELETE_CONFIRMATION_DESCRIPTION", () => {
  it("explains the deletion is permanent and reuses the shared in-use guidance", () => {
    expect(MINT_DELETE_CONFIRMATION_DESCRIPTION).toContain(
      "permanently deletes the Mint"
    )
    expect(MINT_DELETE_CONFIRMATION_DESCRIPTION).toContain(
      MINT_DELETE_REASSIGN_REQUIRED_MESSAGE
    )
  })
})

describe("MintMaintenanceSheet", () => {
  it("shows create mode without delete affordances when no Mint is selected", () => {
    const markup = renderMintMaintenanceSheet(null)

    expect(markup).toContain("Create Mint")
    expect(markup).toContain("MintCreateForm")
    expect(markup).not.toContain("Delete Mint?")
  })

  it("renders the edit-sheet delete action and confirmation copy for an existing Mint", () => {
    const markup = renderMintMaintenanceSheet(mint)

    expect(markup).toContain("Edit Mint")
    expect(markup).toContain("MintEditForm")
    expect(markup).toContain(">Delete<")
    expect(markup).toContain("Delete Mint?")
    expect(markup).toContain(MINT_DELETE_CONFIRMATION_DESCRIPTION)
    expect(markup).toContain(">Cancel<")
  })
})
