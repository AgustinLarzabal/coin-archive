import type { Mint } from "@coin-archive/api"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { MintsTable, filterMints } from "./mints-table"

const mints: Mint[] = [
  {
    id: "eb80363e-d0dc-4a28-8a43-297fbd5d67fc",
    code: "madrid",
    name: "Madrid",
    version: 1,
    etag: '"mint-version-1"',
    createdAt: "2026-06-24T12:00:00.000Z",
    updatedAt: "2026-06-24T12:00:00.000Z",
  },
  {
    id: "d3ed87e0-ebd9-4bbd-a5de-c9d1823ae3a2",
    code: "london",
    name: "London",
    version: 1,
    etag: '"mint-version-1"',
    createdAt: "2026-06-24T12:00:00.000Z",
    updatedAt: "2026-06-24T12:00:00.000Z",
  },
]

describe("filterMints", () => {
  it("returns all Mints when the filter is blank", () => {
    expect(filterMints(mints, "")).toStrictEqual(mints)
  })

  it("filters by code and name case-insensitively while trimming whitespace", () => {
    expect(filterMints(mints, "madrid")).toStrictEqual([mints[0]])
    expect(filterMints(mints, " LONDON ")).toStrictEqual([mints[1]])
  })
})

describe("MintsTable", () => {
  it("renders Mint Code and Mint Name columns with filter and maintenance actions", () => {
    const markup = renderToStaticMarkup(<MintsTable mints={mints} />)

    expect(markup).toContain("Mint Code")
    expect(markup).toContain("Mint Name")
    expect(markup).toContain("Madrid")
    expect(markup).toContain("London")
    expect(markup).toContain("Filter mints by code or name...")
    expect(markup).toContain(">Create</button>")
    expect(markup).toContain('aria-label="Actions"')
  })
})
