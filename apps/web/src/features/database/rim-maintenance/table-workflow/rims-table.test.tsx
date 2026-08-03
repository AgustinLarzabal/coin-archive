import type { Rim } from "@coin-archive/api"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { RimsTable, filterRims } from "./rims-table"

const rims: Rim[] = [
  {
    id: "eb80363e-d0dc-4a28-8a43-297fbd5d67fc",
    code: "reeded",
    name: "Reeded",
    version: 1,
    etag: '"rim-version-1"',
    createdAt: "2026-06-24T12:00:00.000Z",
    updatedAt: "2026-06-24T12:00:00.000Z",
  },
  {
    id: "d3ed87e0-ebd9-4bbd-a5de-c9d1823ae3a2",
    code: "plain",
    name: "Plain",
    version: 1,
    etag: '"rim-version-1"',
    createdAt: "2026-06-24T12:00:00.000Z",
    updatedAt: "2026-06-24T12:00:00.000Z",
  },
]

describe("filterRims", () => {
  it("returns all Rims when the filter is blank", () => {
    expect(filterRims(rims, "")).toStrictEqual(rims)
  })

  it("filters by code and name case-insensitively while trimming whitespace", () => {
    expect(filterRims(rims, "reed")).toStrictEqual([rims[0]])
    expect(filterRims(rims, " PLAIN ")).toStrictEqual([rims[1]])
  })
})

describe("RimsTable", () => {
  it("renders Rim Code and Rim Name columns with filter and maintenance actions", () => {
    const markup = renderToStaticMarkup(<RimsTable rims={rims} />)

    expect(markup).toContain("Rim Code")
    expect(markup).toContain("Rim Name")
    expect(markup).toContain("Reeded")
    expect(markup).toContain("Plain")
    expect(markup).toContain("Filter rims by code or name...")
    expect(markup).toContain(">Create</button>")
    expect(markup).toContain('aria-label="Actions"')
  })
})
