import { describe, expect, it } from "vitest"

import * as issuerMaintenance from "./index"

describe("issuer-maintenance public API", () => {
  it("only exposes the route-facing feature entrypoint", () => {
    expect(Object.keys(issuerMaintenance).sort()).toStrictEqual([
      "IssuerMaintenanceRouteComponent",
      "loadIssuerMaintenanceRouteData",
    ])
  })
})
