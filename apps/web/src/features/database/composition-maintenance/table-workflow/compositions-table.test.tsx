import type { Composition } from "@coin-archive/api"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import {
  CompositionsTable,
  filterCompositionsByName,
} from "./compositions-table"

const compositions: Composition[] = [
  {
    id: "0933c940-842f-42a6-bd41-e3a0d3d27e39",
    code: "copper-nickel",
    name: "Copper-nickel",
    version: 1,
    etag: '"composition-version-1"',
    createdAt: "2026-06-24T12:00:00.000Z",
    updatedAt: "2026-06-24T12:00:00.000Z",
  },
  {
    id: "9ee16bbd-4920-4fb8-a178-0ff0ed56d254",
    code: "silver-900",
    name: "Silver (.900)",
    version: 1,
    etag: '"composition-version-1"',
    createdAt: "2026-06-24T12:00:00.000Z",
    updatedAt: "2026-06-24T12:00:00.000Z",
  },
]

describe("filterCompositionsByName", () => {
  it("returns all compositions when the filter is blank", () => {
    expect(filterCompositionsByName(compositions, "")).toStrictEqual(
      compositions
    )
  })

  it("filters by composition name only", () => {
    expect(filterCompositionsByName(compositions, "silver")).toStrictEqual([
      compositions[1],
    ])
    expect(filterCompositionsByName(compositions, "silver-900")).toStrictEqual(
      []
    )
    expect(filterCompositionsByName(compositions, " copper ")).toStrictEqual([
      compositions[0],
    ])
  })
})

describe("CompositionsTable", () => {
  it("renders code and name without a shared Composition Description column", () => {
    const markup = renderToStaticMarkup(
      <CompositionsTable compositions={compositions} />
    )

    expect(markup).toContain("Code")
    expect(markup).toContain("Name")
    expect(markup).not.toContain("Description")
    expect(markup).toContain('aria-label="Actions"')
    expect(markup).toContain("Copper-nickel")
    expect(markup).toContain("Silver (.900)")
    expect(markup).toContain("Filter compositions by name...")
    expect(markup).toContain(">Create</button>")
  })
})
