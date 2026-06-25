import type { CompositionOption } from "@workspace/db"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import {
  CompositionsTable,
  filterCompositionsByName,
} from "./compositions-table"

const compositions: CompositionOption[] = [
  {
    id: "0933c940-842f-42a6-bd41-e3a0d3d27e39",
    code: "copper-nickel",
    name: "Copper-nickel",
    description: null,
    createdAt: new Date("2026-06-24T12:00:00.000Z"),
    updatedAt: new Date("2026-06-24T12:00:00.000Z"),
  },
  {
    id: "9ee16bbd-4920-4fb8-a178-0ff0ed56d254",
    code: "silver-900",
    name: "Silver (.900)",
    description:
      "Ninety percent silver alloy with enough detail to verify that long Composition Description text stays visually contained within the table layout.",
    createdAt: new Date("2026-06-24T12:00:00.000Z"),
    updatedAt: new Date("2026-06-24T12:00:00.000Z"),
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
  it("renders code, name, and description with empty text for missing descriptions", () => {
    const markup = renderToStaticMarkup(
      <CompositionsTable compositions={compositions} />
    )

    expect(markup).toContain("Code")
    expect(markup).toContain("Name")
    expect(markup).toContain("Description")
    expect(markup).toContain("Copper-nickel")
    expect(markup).toContain("Silver (.900)")
    expect(markup).toContain("Filter compositions by name...")
    expect(markup).toContain(">Create</button>")
    expect(markup).toContain(
      "max-w-[32rem] whitespace-pre-wrap break-words"
    )
    expect(markup).not.toContain(">null<")
  })
})
