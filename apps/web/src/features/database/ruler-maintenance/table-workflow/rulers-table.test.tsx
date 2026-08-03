import type { RulerGroupOption } from "@coin-archive/api"
import type { RulerOption } from "@coin-archive/db"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { filterRulers, RulersTable } from "./rulers-table"

const rulerGroups: RulerGroupOption[] = [
  {
    id: "6f18a1db-9096-433b-b3f1-906c772f7a29",
    code: "house-of-bourbon",
    name: "House of Bourbon",
  },
]

const rulers: RulerOption[] = [
  {
    id: "2f0b5ff0-f4a9-4333-8f6d-dad19cd8510b",
    code: "felipe-v",
    name: "Felipe V",
    group: {
      id: rulerGroups[0].id,
      code: rulerGroups[0].code,
      name: rulerGroups[0].name,
    },
  },
  {
    id: "0a6c3f74-230d-48ff-a2bd-986f9645d6f3",
    code: "liberty",
    name: "Liberty",
    group: null,
  },
]

describe("filterRulers", () => {
  it("returns all Rulers when the filter is blank", () => {
    expect(filterRulers(rulers, "")).toStrictEqual(rulers)
  })

  it("filters by Ruler Code, Ruler Name, and Ruler Group labels case-insensitively while trimming whitespace", () => {
    expect(filterRulers(rulers, " felipe ")).toStrictEqual([rulers[0]])
    expect(filterRulers(rulers, "LIBERTY")).toStrictEqual([rulers[1]])
    expect(filterRulers(rulers, "bourbon")).toStrictEqual([rulers[0]])
    expect(filterRulers(rulers, "house-of-bourbon")).toStrictEqual([rulers[0]])
  })
})

describe("RulersTable", () => {
  it("renders Ruler columns with filter and maintenance actions", () => {
    const markup = renderToStaticMarkup(
      <RulersTable rulers={rulers} rulerGroups={rulerGroups} />
    )

    expect(markup).toContain("Ruler Code")
    expect(markup).toContain("Ruler Name")
    expect(markup).toContain("Ruler Group")
    expect(markup).toContain("Felipe V")
    expect(markup).toContain("Liberty")
    expect(markup).toContain("House of Bourbon (house-of-bourbon)")
    expect(markup).toContain("No Ruler Group")
    expect(markup).toContain("Filter rulers by code, name, or ruler group...")
    expect(markup).toContain(">Create</button>")
    expect(markup).toContain('aria-label="Actions"')
  })
})
