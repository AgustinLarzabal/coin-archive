import type { TechniqueOption } from "@workspace/db"
import { createElement } from "react"
import type { ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { MintingTechniqueMaintenanceSheet } from "./minting-technique-maintenance-sheet"

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

describe("MintingTechniqueMaintenanceSheet", () => {
  it("shows create mode when no Minting Technique is selected", () => {
    const markup = renderMintingTechniqueMaintenanceSheet(null)

    expect(markup).toContain("Create Minting Technique")
    expect(markup).toContain("MintingTechniqueCreateForm")
  })

  it("shows edit mode for an existing Minting Technique", () => {
    const markup = renderMintingTechniqueMaintenanceSheet(mintingTechnique)

    expect(markup).toContain("Edit Minting Technique")
    expect(markup).toContain("MintingTechniqueEditForm")
  })
})
