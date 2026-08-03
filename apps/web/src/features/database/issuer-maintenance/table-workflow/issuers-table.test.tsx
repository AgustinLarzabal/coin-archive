import type { IssuerMaintenanceRecord } from "../issuer-maintenance-route-data"
import { createElement } from "react"
import type { ReactNode } from "react"
import type { Row } from "@tanstack/react-table"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { createIssuerColumns } from "./columns"
import { IssuersTable, filterIssuers } from "./issuers-table"

type MockComponentProps = {
  children?: ReactNode
}

function createMockElement(tagName: string) {
  return function MockElement({ children }: MockComponentProps) {
    return createElement(tagName, null, children)
  }
}

vi.mock("../sheet-workflow/issuer-maintenance-sheet", () => ({
  IssuerMaintenanceSheet: () => null,
}))

vi.mock("@coin-archive/ui/components/dropdown-menu", () => ({
  DropdownMenu: createMockElement("div"),
  DropdownMenuContent: createMockElement("div"),
  DropdownMenuGroup: createMockElement("div"),
  DropdownMenuItem: createMockElement("button"),
  DropdownMenuTrigger: createMockElement("div"),
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
  {
    id: "4ffdfab6-989a-4378-ba8c-3610de04b3ef",
    code: "provincia-de-la-rioja",
    isoCode: "AR",
    name: "Provincia de La Rioja",
    etag: '"issuer-version"',
    parent: {
      id: "dc2f4da3-cfd0-43fa-8900-7a384fc6977a",
      code: "argentine-republic",
      name: "Argentine Republic",
    },
  },
  {
    id: "8dc1babc-c469-427d-9cee-559320c14eef",
    code: "united-states-of-america",
    isoCode: "US",
    name: "United States of America",
    etag: '"issuer-version"',
    parent: null,
  },
]

describe("filterIssuers", () => {
  it("returns all issuers when the filter is blank", () => {
    expect(filterIssuers(issuers, "")).toStrictEqual(issuers)
  })

  it("filters by issuer name, code, ISO code, and parent issuer name while trimming whitespace", () => {
    expect(filterIssuers(issuers, " rioja ")).toStrictEqual([issuers[1]])
    expect(filterIssuers(issuers, "UNITED-STATES")).toStrictEqual([issuers[2]])
    expect(filterIssuers(issuers, "us")).toStrictEqual([issuers[2]])
    expect(filterIssuers(issuers, "argentine republic")).toStrictEqual([
      issuers[0],
      issuers[1],
    ])
  })
})

describe("IssuersTable", () => {
  it("includes edit and delete actions in the row menu", () => {
    const columns = createIssuerColumns(vi.fn(), vi.fn())
    const actionsColumn = columns.find((column) => column.id === "actions")

    if (!actionsColumn?.cell) {
      throw new Error("Expected Issuer actions column to define a cell")
    }

    const renderActionsCell = actionsColumn.cell as (props: {
      row: Pick<Row<IssuerMaintenanceRecord>, "original">
    }) => ReactNode

    const markup = renderToStaticMarkup(
      createElement(renderActionsCell, {
        row: { original: issuers[0] },
      })
    )

    expect(markup).toContain("Edit")
    expect(markup).toContain("Delete Issuer")
  })

  it("renders issuer columns, parent context, and the filter toolbar without router warnings", () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined)

    const markup = renderToStaticMarkup(<IssuersTable issuers={issuers} />)

    expect(markup).toContain("Issuer Name")
    expect(markup).toContain("Issuer Code")
    expect(markup).toContain("Issuer ISO Code")
    expect(markup).toContain("Parent Issuer")
    expect(markup).toContain("Argentine Republic")
    expect(markup).toContain('src="https://flagcdn.com/ar.svg"')
    expect(markup).toContain('alt="Argentine Republic flag"')
    expect(markup).toContain("Provincia de La Rioja")
    expect(markup).toContain("argentine-republic")
    expect(markup).toContain("No Parent Issuer")
    expect(markup).toContain(
      "Filter issuers by name, code, ISO code, or parent issuer..."
    )
    expect(markup).toContain("Create Issuer")
    expect(consoleErrorSpy).not.toHaveBeenCalled()

    consoleErrorSpy.mockRestore()
  })
})
