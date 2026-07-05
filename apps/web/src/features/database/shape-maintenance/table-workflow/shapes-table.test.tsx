import type { ShapeOption } from "@workspace/db"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { filterShapes, ShapesTable } from "./shapes-table"

const shapes: ShapeOption[] = [
  {
    id: "2f0b5ff0-f4a9-4333-8f6d-dad19cd8510b",
    code: "round",
    name: "Round",
    createdAt: new Date("2026-07-01T00:00:00.000Z"),
    updatedAt: new Date("2026-07-01T00:00:00.000Z"),
  },
  {
    id: "0a6c3f74-230d-48ff-a2bd-986f9645d6f3",
    code: "scalloped",
    name: "Scalloped",
    createdAt: new Date("2026-07-01T00:00:00.000Z"),
    updatedAt: new Date("2026-07-01T00:00:00.000Z"),
  },
]

describe("filterShapes", () => {
  it("returns all Shapes when the filter is blank", () => {
    expect(filterShapes(shapes, "")).toStrictEqual(shapes)
  })

  it("filters by Shape Code and Shape Name case-insensitively while trimming whitespace", () => {
    expect(filterShapes(shapes, " round ")).toStrictEqual([shapes[0]])
    expect(filterShapes(shapes, "SCALLOPED")).toStrictEqual([shapes[1]])
  })
})

describe("ShapesTable", () => {
  it("renders Shape Code and Shape Name columns with filter and maintenance actions", () => {
    const markup = renderToStaticMarkup(<ShapesTable shapes={shapes} />)

    expect(markup).toContain("Shape Code")
    expect(markup).toContain("Shape Name")
    expect(markup).toContain("Round")
    expect(markup).toContain("Scalloped")
    expect(markup).toContain("Filter shapes by code or name...")
    expect(markup).toContain(">Create</button>")
    expect(markup).toContain('aria-label="Actions"')
  })
})
