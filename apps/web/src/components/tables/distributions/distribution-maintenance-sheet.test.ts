import type { DistributionOption } from "@workspace/db"
import { createElement } from "react"
import type { ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { DISTRIBUTION_DELETE_EXISTING_COINS_REASSIGN_REQUIRED_MESSAGE } from "@/lib/distribution-maintenance"

import {
  DISTRIBUTION_DELETE_CONFIRMATION_DESCRIPTION,
} from "./distribution-maintenance-sheet"
import { DistributionMaintenanceSheet } from "./distribution-maintenance-sheet"

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

vi.mock("./distribution-create-form", () => ({
  DistributionCreateForm: () =>
    createElement("div", null, "DistributionCreateForm"),
}))

vi.mock("./distribution-edit-form", () => ({
  DistributionEditForm: () => createElement("div", null, "DistributionEditForm"),
}))

const distribution: DistributionOption = {
  id: "84863d38-795b-443c-bd27-1dedb73c0fad",
  code: "standard-circulation",
  name: "Standard circulation",
}

function renderDistributionMaintenanceSheet(
  distributionOption: DistributionOption | null
) {
  return renderToStaticMarkup(
    createElement(DistributionMaintenanceSheet, {
      distribution: distributionOption,
      open: true,
      onOpenChange: vi.fn(),
    })
  )
}

describe("DISTRIBUTION_DELETE_CONFIRMATION_DESCRIPTION", () => {
  it("explains the deletion is permanent and reuses the shared reassignment rule", () => {
    expect(DISTRIBUTION_DELETE_CONFIRMATION_DESCRIPTION).toContain(
      "permanently deletes the Distribution"
    )
    expect(DISTRIBUTION_DELETE_CONFIRMATION_DESCRIPTION).toContain(
      "existing Coins"
    )
    expect(DISTRIBUTION_DELETE_CONFIRMATION_DESCRIPTION).toContain(
      DISTRIBUTION_DELETE_EXISTING_COINS_REASSIGN_REQUIRED_MESSAGE
    )
  })
})

describe("DistributionMaintenanceSheet", () => {
  it("shows create mode without delete affordances when no Distribution is selected", () => {
    const markup = renderDistributionMaintenanceSheet(null)

    expect(markup).toContain("Create Distribution")
    expect(markup).toContain("DistributionCreateForm")
    expect(markup).not.toContain("Delete Distribution?")
  })

  it("renders the edit-sheet delete action and confirmation copy for an existing Distribution", () => {
    const markup = renderDistributionMaintenanceSheet(distribution)

    expect(markup).toContain("Edit Distribution")
    expect(markup).toContain("DistributionEditForm")
    expect(markup).toContain(">Delete<")
    expect(markup).toContain("Delete Distribution?")
    expect(markup).toContain(DISTRIBUTION_DELETE_CONFIRMATION_DESCRIPTION)
    expect(markup).toContain(">Cancel<")
  })
})
