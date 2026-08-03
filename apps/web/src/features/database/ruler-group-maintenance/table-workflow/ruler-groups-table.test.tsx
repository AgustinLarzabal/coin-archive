import type { RulerGroup } from "@coin-archive/api"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { RulerGroupsTable, filterRulerGroups } from "./ruler-groups-table"

const rulerGroups: RulerGroup[] = [
  {
    id: "eb80363e-d0dc-4a28-8a43-297fbd5d67fc",
    code: "reeded",
    name: "Reeded",
    version: 1,
    etag: '"ruler-group-version-1"',
    createdAt: "2026-06-24T12:00:00.000Z",
    updatedAt: "2026-06-24T12:00:00.000Z",
  },
  {
    id: "d3ed87e0-ebd9-4bbd-a5de-c9d1823ae3a2",
    code: "plain",
    name: "Plain",
    version: 1,
    etag: '"ruler-group-version-1"',
    createdAt: "2026-06-24T12:00:00.000Z",
    updatedAt: "2026-06-24T12:00:00.000Z",
  },
]

describe("filterRulerGroups", () => {
  it("returns all RulerGroups when the filter is blank", () => {
    expect(filterRulerGroups(rulerGroups, "")).toStrictEqual(rulerGroups)
  })

  it("filters by code and name case-insensitively while trimming whitespace", () => {
    expect(filterRulerGroups(rulerGroups, "reed")).toStrictEqual([
      rulerGroups[0],
    ])
    expect(filterRulerGroups(rulerGroups, " PLAIN ")).toStrictEqual([
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
    expect(markup).toContain("Reeded")
    expect(markup).toContain("Plain")
    expect(markup).toContain("Filter ruler groups by code or name...")
    expect(markup).toContain(">Create</button>")
    expect(markup).toContain('aria-label="Actions"')
  })
})
