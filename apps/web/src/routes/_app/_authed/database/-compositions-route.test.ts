import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const ROUTE_SOURCE = readFileSync(new URL("./compositions.tsx", import.meta.url), "utf8")

describe("database compositions route adapter", () => {
  it("wires the route directly to the Composition feature public API", () => {
    expect(ROUTE_SOURCE).toContain(
      'from "@/features/database/composition-maintenance"'
    )
    expect(ROUTE_SOURCE).toContain(
      "loader: loadCompositionMaintenanceRouteData"
    )
  })
})
