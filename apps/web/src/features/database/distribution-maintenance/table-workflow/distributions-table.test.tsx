import type { Distribution } from "@coin-archive/api"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import {
  DistributionsTable,
  filterDistributionsByName,
} from "./distributions-table"

const distributions: Distribution[] = [
  {
    id: "0933c940-842f-42a6-bd41-e3a0d3d27e39",
    code: "copper-nickel",
    name: "Copper-nickel",
    version: 1,
    etag: '"distribution-version-1"',
    createdAt: "2026-06-24T12:00:00.000Z",
    updatedAt: "2026-06-24T12:00:00.000Z",
  },
  {
    id: "9ee16bbd-4920-4fb8-a178-0ff0ed56d254",
    code: "silver-900",
    name: "Silver (.900)",
    version: 1,
    etag: '"distribution-version-1"',
    createdAt: "2026-06-24T12:00:00.000Z",
    updatedAt: "2026-06-24T12:00:00.000Z",
  },
]

describe("filterDistributionsByName", () => {
  it("returns all distributions when the filter is blank", () => {
    expect(filterDistributionsByName(distributions, "")).toStrictEqual(
      distributions
    )
  })

  it("filters by distribution name only", () => {
    expect(filterDistributionsByName(distributions, "silver")).toStrictEqual([
      distributions[1],
    ])
    expect(
      filterDistributionsByName(distributions, "silver-900")
    ).toStrictEqual([])
    expect(filterDistributionsByName(distributions, " copper ")).toStrictEqual([
      distributions[0],
    ])
  })
})

describe("DistributionsTable", () => {
  it("renders code and name without a shared Distribution Description column", () => {
    const markup = renderToStaticMarkup(
      <DistributionsTable distributions={distributions} />
    )

    expect(markup).toContain("Code")
    expect(markup).toContain("Name")
    expect(markup).not.toContain("Description")
    expect(markup).toContain('aria-label="Actions"')
    expect(markup).toContain("Copper-nickel")
    expect(markup).toContain("Silver (.900)")
    expect(markup).toContain("Filter distributions by name...")
    expect(markup).toContain(">Create</button>")
  })
})
