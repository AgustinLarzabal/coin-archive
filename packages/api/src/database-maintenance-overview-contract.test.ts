import { describe, expect, it } from "vitest"

import {
  databaseMaintenanceOverviewOutputSchema,
  maintenanceApiContract,
  publicApiContract,
} from "./index"

const counts = {
  coins: 14,
  catalogues: 3,
  compositions: 5,
  currencies: 2,
  distributions: 4,
  edges: 7,
  rims: 11,
  shapes: 12,
  mintingTechniques: 9,
  engravers: 6,
  themes: 13,
  issuers: 8,
  rulers: 5,
  rulerGroups: 4,
  orientations: 10,
  mints: 9,
}

describe("Database Maintenance overview contract", () => {
  it("defines a count projection for all sixteen maintenance sections", () => {
    expect(
      databaseMaintenanceOverviewOutputSchema.parse({ data: counts })
    ).toStrictEqual({ data: counts })
    expect(Object.keys(counts)).toHaveLength(16)
  })

  it("publishes the overview as a protected maintenance read", () => {
    expect(maintenanceApiContract.overview.get["~orpc"].route).toMatchObject({
      method: "GET",
      path: "/api/v1/maintenance/overview",
      tags: ["Database Maintenance"],
    })
  })

  it("does not add the protected overview to the public API contract", () => {
    expect(Object.keys(publicApiContract)).toStrictEqual(["coins"])
  })
})
