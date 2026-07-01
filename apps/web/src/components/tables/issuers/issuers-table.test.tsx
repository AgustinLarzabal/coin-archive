import type { IssuerMaintenanceRecord } from "@workspace/db"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { IssuersTable, filterIssuers } from "./issuers-table"

vi.mock("./issuer-maintenance-sheet", () => ({
  IssuerMaintenanceSheet: () => null,
}))

const issuers: IssuerMaintenanceRecord[] = [
  {
    id: "dc2f4da3-cfd0-43fa-8900-7a384fc6977a",
    code: "argentine-republic",
    isoCode: "AR",
    name: "Argentine Republic",
    parent: null,
  },
  {
    id: "4ffdfab6-989a-4378-ba8c-3610de04b3ef",
    code: "provincia-de-la-rioja",
    isoCode: "AR",
    name: "Provincia de La Rioja",
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
    expect(markup).toContain("Provincia de La Rioja")
    expect(markup).toContain("argentine-republic")
    expect(markup).toContain("No Parent Issuer")
    expect(markup).toContain(
      "Filter issuers by name, code, ISO code, or parent issuer..."
    )
    expect(markup).toContain("Create Issuer")
    expect(markup).toContain("Actions")
    expect(consoleErrorSpy).not.toHaveBeenCalled()

    consoleErrorSpy.mockRestore()
  })
})
