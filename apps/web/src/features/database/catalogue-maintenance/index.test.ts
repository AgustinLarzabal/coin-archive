import { existsSync } from "node:fs"
import { describe, expect, it } from "vitest"

import {
  getFeatureSourceFiles,
  readFeatureSource,
} from "../public-api-test-helpers"
import * as catalogueMaintenance from "./index"

const FEATURE_DIRECTORY_URL = new URL(".", import.meta.url)
const FEATURE_ALIAS = "@/features/database/catalogue-maintenance"

describe("catalogue-maintenance public API", () => {
  it("only exposes the route-facing feature entrypoint", () => {
    expect(Object.keys(catalogueMaintenance).sort()).toStrictEqual([
      "CatalogueMaintenanceRouteComponent",
      "loadCatalogueMaintenanceRouteData",
    ])
  })

  it("avoids internal self-imports through the feature alias", () => {
    for (const filePath of getFeatureSourceFiles(FEATURE_DIRECTORY_URL, true)) {
      if (filePath === "index.test.ts" || filePath.endsWith(".test.tsx")) {
        continue
      }

      expect(readFeatureSource(FEATURE_DIRECTORY_URL, filePath)).not.toMatch(
        FEATURE_ALIAS
      )
    }
  })

  it("keeps the feature entrypoint at the root only", () => {
    expect(
      getFeatureSourceFiles(FEATURE_DIRECTORY_URL, true).filter(
        (filePath) => filePath !== "index.ts" && filePath.endsWith("/index.ts")
      )
    ).toStrictEqual([])
    expect(existsSync(new URL("index.ts", FEATURE_DIRECTORY_URL))).toBe(true)
  })
})
