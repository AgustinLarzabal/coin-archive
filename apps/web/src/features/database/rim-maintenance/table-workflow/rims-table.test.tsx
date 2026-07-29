import type { RimOption } from "@coin-archive/db"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { RimsTable, filterRims } from "./rims-table"

const rims: RimOption[] = [
  {
    id: "dff33645-e973-4fd5-a84d-bf5a773855ef",
    code: "raised",
    name: "Raised rim",
    createdAt: new Date("2026-07-01T00:00:00.000Z"),
    updatedAt: new Date("2026-07-01T00:00:00.000Z"),
  },
  {
    id: "7d2c7fb9-0ac4-4eb8-ae90-31fe67e5f451",
    code: "barred",
    name: "Barred rim",
    createdAt: new Date("2026-07-01T00:00:00.000Z"),
    updatedAt: new Date("2026-07-01T00:00:00.000Z"),
  },
]

describe("filterRims", () => {
  it("returns all Rims when the filter is blank", () => {
    expect(filterRims(rims, "")).toStrictEqual(rims)
  })

  it("filters by code and name case-insensitively while trimming whitespace", () => {
    expect(filterRims(rims, " raised ")).toStrictEqual([rims[0]])
    expect(filterRims(rims, "BARRED")).toStrictEqual([rims[1]])
  })
})

describe("RimsTable", () => {
  it("renders Rim Code and Rim Name columns with filter and maintenance actions", () => {
    const markup = renderToStaticMarkup(<RimsTable rims={rims} />)

    expect(markup).toContain("Rim Code")
    expect(markup).toContain("Rim Name")
    expect(markup).toContain("Raised rim")
    expect(markup).toContain("Barred rim")
    expect(markup).toContain("Filter rims by code or name...")
    expect(markup).toContain(">Create</button>")
    expect(markup).toContain('aria-label="Actions"')
  })
})
