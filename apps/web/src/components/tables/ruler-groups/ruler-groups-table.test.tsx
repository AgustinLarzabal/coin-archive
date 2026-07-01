import type { RulerGroupOption } from "@workspace/db"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { filterRulerGroups, RulerGroupsTable } from "./ruler-groups-table"

const rulerGroups: RulerGroupOption[] = [
  {
    id: "2f0b5ff0-f4a9-4333-8f6d-dad19cd8510b",
    code: "house-of-bourbon",
    name: "House of Bourbon",
    createdAt: new Date("2026-07-01T00:00:00.000Z"),
    updatedAt: new Date("2026-07-01T00:00:00.000Z"),
  },
  {
    id: "0a6c3f74-230d-48ff-a2bd-986f9645d6f3",
    code: "julio-claudians",
    name: "Julio-Claudians",
    createdAt: new Date("2026-07-01T00:00:00.000Z"),
    updatedAt: new Date("2026-07-01T00:00:00.000Z"),
  },
]

describe("filterRulerGroups", () => {
  it("returns all Ruler Groups when the filter is blank", () => {
    expect(filterRulerGroups(rulerGroups, "")).toStrictEqual(rulerGroups)
  })

  it("filters by Ruler Group Code and Ruler Group Name case-insensitively while trimming whitespace", () => {
    expect(filterRulerGroups(rulerGroups, " bourbon ")).toStrictEqual([
      rulerGroups[0],
    ])
    expect(filterRulerGroups(rulerGroups, "JULIO")).toStrictEqual([
      rulerGroups[1],
    ])
  })
})

describe("RulerGroupsTable", () => {
  it("renders Ruler Group Code and Ruler Group Name columns with filter and maintenance actions", () => {
    const markup = renderToStaticMarkup(
      <RulerGroupsTable rulerGroups={rulerGroups} />
    )

    expect(markup).toContain("Ruler Group Code")
    expect(markup).toContain("Ruler Group Name")
    expect(markup).toContain("House of Bourbon")
    expect(markup).toContain("Julio-Claudians")
    expect(markup).toContain("Filter ruler groups by code or name...")
    expect(markup).toContain(">Create</button>")
    expect(markup).toContain('aria-label="Actions"')
  })
})
