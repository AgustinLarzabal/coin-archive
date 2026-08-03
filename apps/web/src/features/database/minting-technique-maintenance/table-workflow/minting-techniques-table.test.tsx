import type { MintingTechnique } from "@coin-archive/api"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import {
  MintingTechniquesTable,
  filterMintingTechniques,
} from "./minting-techniques-table"

const mintingTechniques: MintingTechnique[] = [
  {
    id: "eb80363e-d0dc-4a28-8a43-297fbd5d67fc",
    code: "reeded",
    name: "Reeded",
    version: 1,
    etag: '"minting-technique-version-1"',
    createdAt: "2026-06-24T12:00:00.000Z",
    updatedAt: "2026-06-24T12:00:00.000Z",
  },
  {
    id: "d3ed87e0-ebd9-4bbd-a5de-c9d1823ae3a2",
    code: "plain",
    name: "Plain",
    version: 1,
    etag: '"minting-technique-version-1"',
    createdAt: "2026-06-24T12:00:00.000Z",
    updatedAt: "2026-06-24T12:00:00.000Z",
  },
]

describe("filterMintingTechniques", () => {
  it("returns all MintingTechniques when the filter is blank", () => {
    expect(filterMintingTechniques(mintingTechniques, "")).toStrictEqual(
      mintingTechniques
    )
  })

  it("filters by code and name case-insensitively while trimming whitespace", () => {
    expect(filterMintingTechniques(mintingTechniques, "reed")).toStrictEqual([
      mintingTechniques[0],
    ])
    expect(filterMintingTechniques(mintingTechniques, " PLAIN ")).toStrictEqual(
      [mintingTechniques[1]]
    )
  })
})

describe("MintingTechniquesTable", () => {
  it("renders Minting Technique Code and Minting Technique Name columns with filter and maintenance actions", () => {
    const markup = renderToStaticMarkup(
      <MintingTechniquesTable mintingTechniques={mintingTechniques} />
    )

    expect(markup).toContain("Minting Technique Code")
    expect(markup).toContain("Minting Technique Name")
    expect(markup).toContain("Reeded")
    expect(markup).toContain("Plain")
    expect(markup).toContain("Filter mintingTechniques by code or name...")
    expect(markup).toContain(">Create</button>")
    expect(markup).toContain('aria-label="Actions"')
  })
})
