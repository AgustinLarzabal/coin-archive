import type { TechniqueOption } from "@workspace/db"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import {
  filterMintingTechniques,
  MintingTechniquesTable,
} from "./minting-techniques-table"

const mintingTechniques: TechniqueOption[] = [
  {
    id: "8bfd8928-cd58-4a23-b13c-969be89f4d88",
    code: "hammered",
    name: "Hammered",
    createdAt: new Date("2026-07-02T00:00:00.000Z"),
    updatedAt: new Date("2026-07-02T00:00:00.000Z"),
  },
  {
    id: "6cb490db-79b4-40ca-88db-30d49473ec30",
    code: "machine-struck",
    name: "Machine struck",
    createdAt: new Date("2026-07-02T00:00:00.000Z"),
    updatedAt: new Date("2026-07-02T00:00:00.000Z"),
  },
]

describe("filterMintingTechniques", () => {
  it("filters by Minting Technique Code and Minting Technique Name case-insensitively while trimming whitespace", () => {
    expect(filterMintingTechniques(mintingTechniques, " hammered ")).toStrictEqual([
      mintingTechniques[0],
    ])
    expect(filterMintingTechniques(mintingTechniques, "MACHINE")).toStrictEqual([
      mintingTechniques[1],
    ])
  })
})

describe("MintingTechniquesTable", () => {
  it("renders Minting Technique Code and Minting Technique Name columns with a filter toolbar", () => {
    const markup = renderToStaticMarkup(
      <MintingTechniquesTable mintingTechniques={mintingTechniques} />
    )

    expect(markup).toContain("Minting Technique Code")
    expect(markup).toContain("Minting Technique Name")
    expect(markup).toContain("Hammered")
    expect(markup).toContain("Machine struck")
    expect(markup).toContain("Filter minting techniques by code or name...")
  })
})
