import type { OrientationOption } from "@workspace/db"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import {
  filterOrientations,
  OrientationsTable,
} from "./orientations-table"

const orientations: OrientationOption[] = [
  {
    id: "645c07ac-cfbb-4a29-b056-9680634c6c2c",
    code: "coin-alignment",
    name: "Coin alignment",
    createdAt: new Date("2026-07-01T00:00:00.000Z"),
    updatedAt: new Date("2026-07-01T00:00:00.000Z"),
  },
  {
    id: "9c65c9ed-eb9d-4cf5-986f-1346d6a326ca",
    code: "medal-alignment",
    name: "Medal alignment",
    createdAt: new Date("2026-07-01T00:00:00.000Z"),
    updatedAt: new Date("2026-07-01T00:00:00.000Z"),
  },
]

describe("filterOrientations", () => {
  it("returns all Orientations when the filter is blank", () => {
    expect(filterOrientations(orientations, "")).toStrictEqual(orientations)
  })

  it("filters by Orientation Code and Orientation Name case-insensitively while trimming whitespace", () => {
    expect(filterOrientations(orientations, " coin-alignment ")).toStrictEqual([
      orientations[0],
    ])
    expect(filterOrientations(orientations, "MEDAL")).toStrictEqual([
      orientations[1],
    ])
  })
})

describe("OrientationsTable", () => {
  it("renders Orientation Code and Orientation Name columns with a read-only filter toolbar", () => {
    const markup = renderToStaticMarkup(
      <OrientationsTable orientations={orientations} />
    )

    expect(markup).toContain("Orientation Code")
    expect(markup).toContain("Orientation Name")
    expect(markup).toContain("Coin alignment")
    expect(markup).toContain("Medal alignment")
    expect(markup).toContain("Filter orientations by code or name...")
    expect(markup).not.toContain("Create")
    expect(markup).not.toContain('aria-label="Actions"')
  })
})
