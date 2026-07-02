import type { RulerGroupOption, RulerOption } from "@workspace/db"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { filterRulers, RulersTable } from "./rulers-table"

const rulerGroups: RulerGroupOption[] = [
  {
    id: "2f0b5ff0-f4a9-4333-8f6d-dad19cd8510b",
    code: "house-of-bourbon",
    name: "House of Bourbon",
    createdAt: new Date("2026-07-01T00:00:00.000Z"),
    updatedAt: new Date("2026-07-01T00:00:00.000Z"),
  },
]

const rulers: RulerOption[] = [
  {
    id: "49593601-9276-4761-a03b-f5e43cf674fd",
    code: "louis-xiv",
    name: "Louis XIV",
    group: {
      id: rulerGroups[0].id,
      code: rulerGroups[0].code,
      name: rulerGroups[0].name,
    },
  },
  {
    id: "4c685de3-63fc-43eb-9a84-d6a228e4ad44",
    code: "liberty",
    name: "Liberty",
    group: null,
  },
]

describe("filterRulers", () => {
  it("returns all Rulers when the filter is blank", () => {
    expect(filterRulers(rulers, "")).toStrictEqual(rulers)
  })

  it("filters by Ruler Code, Ruler Name, Ruler Group name, and Ruler Group code case-insensitively while trimming whitespace", () => {
    expect(filterRulers(rulers, " louis ")).toStrictEqual([rulers[0]])
    expect(filterRulers(rulers, "LIBERTY")).toStrictEqual([rulers[1]])
    expect(filterRulers(rulers, "bourbon")).toStrictEqual([rulers[0]])
    expect(filterRulers(rulers, "HOUSE-OF-BOURBON")).toStrictEqual([rulers[0]])
  })
})

describe("RulersTable", () => {
  it("renders Ruler Code, Ruler Name, and Ruler Group columns with filter and maintenance actions", () => {
    const markup = renderToStaticMarkup(
      <RulersTable rulers={rulers} rulerGroups={rulerGroups} />
    )

    expect(markup).toContain("Ruler Code")
    expect(markup).toContain("Ruler Name")
    expect(markup).toContain("Ruler Group")
    expect(markup).toContain("Louis XIV")
    expect(markup).toContain("House of Bourbon (house-of-bourbon)")
    expect(markup).toContain("None")
    expect(markup).toContain("Filter rulers by code, name, or ruler group...")
    expect(markup).toContain(">Create</button>")
    expect(markup).toContain('aria-label="Actions"')
  })
})
