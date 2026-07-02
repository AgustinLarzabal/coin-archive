import type { TechniqueOption } from "@workspace/db"
import { createElement } from "react"
import type { ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { MINTING_TECHNIQUE_IN_USE_DELETE_GUIDANCE } from "@/lib/minting-technique-maintenance"

import {
  MINTING_TECHNIQUE_DELETE_CONFIRMATION_DESCRIPTION,
  MintingTechniqueMaintenanceSheet,
} from "./minting-technique-maintenance-sheet"

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

vi.mock("./minting-technique-create-form", () => ({
  MintingTechniqueCreateForm: () =>
    createElement("div", null, "MintingTechniqueCreateForm"),
}))

vi.mock("./minting-technique-edit-form", () => ({
  MintingTechniqueEditForm: () =>
    createElement("div", null, "MintingTechniqueEditForm"),
}))

const mintingTechnique: TechniqueOption = {
  id: "8bfd8928-cd58-4a23-b13c-969be89f4d88",
  code: "hammered",
  name: "Hammered",
  createdAt: new Date("2026-07-02T00:00:00.000Z"),
  updatedAt: new Date("2026-07-02T00:00:00.000Z"),
}

function renderMintingTechniqueMaintenanceSheet(
  mintingTechniqueOption: TechniqueOption | null
) {
  return renderToStaticMarkup(
    createElement(MintingTechniqueMaintenanceSheet, {
      mintingTechnique: mintingTechniqueOption,
      open: true,
      onOpenChange: vi.fn(),
    })
  )
}

describe("MINTING_TECHNIQUE_DELETE_CONFIRMATION_DESCRIPTION", () => {
  it("explains the deletion is permanent and reuses the shared in-use guidance", () => {
    expect(MINTING_TECHNIQUE_DELETE_CONFIRMATION_DESCRIPTION).toContain(
      "permanently deletes the Minting Technique"
    )
    expect(MINTING_TECHNIQUE_DELETE_CONFIRMATION_DESCRIPTION).toContain(
      MINTING_TECHNIQUE_IN_USE_DELETE_GUIDANCE
    )
  })
})

describe("MintingTechniqueMaintenanceSheet", () => {
  it("shows create mode without delete affordances when no Minting Technique is selected", () => {
    const markup = renderMintingTechniqueMaintenanceSheet(null)

    expect(markup).toContain("Create Minting Technique")
    expect(markup).toContain("MintingTechniqueCreateForm")
    expect(markup).not.toContain("Delete Minting Technique?")
  })

  it("renders the edit-sheet delete action and confirmation copy for an existing Minting Technique", () => {
    const markup = renderMintingTechniqueMaintenanceSheet(mintingTechnique)

    expect(markup).toContain("Edit Minting Technique")
    expect(markup).toContain("MintingTechniqueEditForm")
    expect(markup).toContain(">Delete<")
    expect(markup).toContain("Delete Minting Technique?")
    expect(markup).toContain(MINTING_TECHNIQUE_DELETE_CONFIRMATION_DESCRIPTION)
    expect(markup).toContain(">Cancel<")
  })
})
