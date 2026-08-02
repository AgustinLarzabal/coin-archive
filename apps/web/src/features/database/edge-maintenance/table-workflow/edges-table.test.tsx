import type { Edge } from "@coin-archive/api"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { EdgesTable, filterEdges } from "./edges-table"

const edges: Edge[] = [
  {
    id: "eb80363e-d0dc-4a28-8a43-297fbd5d67fc",
    code: "reeded",
    name: "Reeded",
    version: 1,
    etag: '"edge-version-1"',
    createdAt: "2026-06-24T12:00:00.000Z",
    updatedAt: "2026-06-24T12:00:00.000Z",
  },
  {
    id: "d3ed87e0-ebd9-4bbd-a5de-c9d1823ae3a2",
    code: "plain",
    name: "Plain",
    version: 1,
    etag: '"edge-version-1"',
    createdAt: "2026-06-24T12:00:00.000Z",
    updatedAt: "2026-06-24T12:00:00.000Z",
  },
]

describe("filterEdges", () => {
  it("returns all Edges when the filter is blank", () => {
    expect(filterEdges(edges, "")).toStrictEqual(edges)
  })

  it("filters by code and name case-insensitively while trimming whitespace", () => {
    expect(filterEdges(edges, "reed")).toStrictEqual([edges[0]])
    expect(filterEdges(edges, " PLAIN ")).toStrictEqual([edges[1]])
  })
})

describe("EdgesTable", () => {
  it("renders Edge Code and Edge Name columns with filter and maintenance actions", () => {
    const markup = renderToStaticMarkup(<EdgesTable edges={edges} />)

    expect(markup).toContain("Edge Code")
    expect(markup).toContain("Edge Name")
    expect(markup).toContain("Reeded")
    expect(markup).toContain("Plain")
    expect(markup).toContain("Filter edges by code or name...")
    expect(markup).toContain(">Create</button>")
    expect(markup).toContain('aria-label="Actions"')
  })
})
