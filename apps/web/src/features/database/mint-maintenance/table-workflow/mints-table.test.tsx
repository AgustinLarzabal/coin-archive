import type { MintOption } from "@coin-archive/db"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { MintsTable, filterMints } from "./mints-table"

vi.mock("../sheet-workflow/mint-maintenance-sheet", () => ({
  MintMaintenanceSheet: () => null,
}))

const mints: MintOption[] = [
  {
    id: "d2661fdc-5fd4-4d89-8bd6-1ca8d9b17b97",
    code: "buenos-aires-mint",
    name: "Buenos Aires Mint",
    createdAt: new Date("2026-07-01T00:00:00.000Z"),
    updatedAt: new Date("2026-07-01T00:00:00.000Z"),
  },
  {
    id: "2f7265fc-0ddf-49bc-b90a-71b3466ee3bd",
    code: "royal-mint-of-madrid",
    name: "Royal Mint of Madrid",
    createdAt: new Date("2026-07-01T00:00:00.000Z"),
    updatedAt: new Date("2026-07-01T00:00:00.000Z"),
  },
]

describe("filterMints", () => {
  it("returns all Mints when the filter is blank", () => {
    expect(filterMints(mints, "")).toStrictEqual(mints)
  })

  it("filters by Mint Code and Mint Name case-insensitively while trimming whitespace", () => {
    expect(filterMints(mints, " buenos-aires ")).toStrictEqual([mints[0]])
    expect(filterMints(mints, "MADRID")).toStrictEqual([mints[1]])
  })
})

describe("MintsTable", () => {
  it("renders Mint Code and Mint Name columns with maintenance actions", () => {
    const markup = renderToStaticMarkup(<MintsTable mints={mints} />)

    expect(markup).toContain("Mint Code")
    expect(markup).toContain("Mint Name")
    expect(markup).toContain("Buenos Aires Mint")
    expect(markup).toContain("Royal Mint of Madrid")
    expect(markup).toContain("Filter mints by code or name...")
    expect(markup).toContain("Create")
    expect(markup).toContain('aria-label="Actions"')
  })
})
