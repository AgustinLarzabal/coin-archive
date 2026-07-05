import { readdirSync, readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

import * as rulerMaintenance from "./index"

const FEATURE_DIRECTORY_URL = new URL(".", import.meta.url)
const FEATURE_ALIAS = "@/features/database/ruler-maintenance"

function getFeatureSourceFiles(): string[] {
  return readdirSync(FEATURE_DIRECTORY_URL, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((filePath) => filePath.endsWith(".ts") || filePath.endsWith(".tsx"))
}

function readFeatureSource(filePath: string) {
  return readFileSync(new URL(filePath, FEATURE_DIRECTORY_URL), "utf8")
}

describe("ruler-maintenance public API", () => {
  it("only exposes the route-facing feature entrypoint", () => {
    expect(Object.keys(rulerMaintenance).sort()).toStrictEqual([
      "RulerMaintenanceRouteComponent",
      "loadRulerMaintenanceRouteData",
    ])
  })

  it("avoids internal self-imports through the feature alias", () => {
    for (const filePath of getFeatureSourceFiles()) {
      if (filePath === "index.test.ts" || filePath.endsWith(".test.tsx")) {
        continue
      }

      expect(readFeatureSource(filePath)).not.toMatch(FEATURE_ALIAS)
    }
  })
})
