import type { Shape } from "@coin-archive/api"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { ShapesTable, filterShapes } from "./shapes-table"

const shapes: Shape[] = [
  {
    id: "eb80363e-d0dc-4a28-8a43-297fbd5d67fc",
    code: "reeded",
    name: "Reeded",
    version: 1,
    etag: '"shape-version-1"',
    createdAt: "2026-06-24T12:00:00.000Z",
    updatedAt: "2026-06-24T12:00:00.000Z",
  },
  {
    id: "d3ed87e0-ebd9-4bbd-a5de-c9d1823ae3a2",
    code: "plain",
    name: "Plain",
    version: 1,
    etag: '"shape-version-1"',
    createdAt: "2026-06-24T12:00:00.000Z",
    updatedAt: "2026-06-24T12:00:00.000Z",
  },
]

describe("filterShapes", () => {
  it("returns all Shapes when the filter is blank", () => {
    expect(filterShapes(shapes, "")).toStrictEqual(shapes)
  })

  it("filters by code and name case-insensitively while trimming whitespace", () => {
    expect(filterShapes(shapes, "reed")).toStrictEqual([shapes[0]])
    expect(filterShapes(shapes, " PLAIN ")).toStrictEqual([shapes[1]])
  })
})

describe("ShapesTable", () => {
  it("renders Shape Code and Shape Name columns with filter and maintenance actions", () => {
    const markup = renderToStaticMarkup(<ShapesTable shapes={shapes} />)

    expect(markup).toContain("Shape Code")
    expect(markup).toContain("Shape Name")
    expect(markup).toContain("Reeded")
    expect(markup).toContain("Plain")
    expect(markup).toContain("Filter shapes by code or name...")
    expect(markup).toContain(">Create</button>")
    expect(markup).toContain('aria-label="Actions"')
  })
})
