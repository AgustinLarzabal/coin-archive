import { describe, expect, it } from "vitest"

import * as feature from "./index"
import { assertFeaturePublicApi } from "../public-api-contract"
import { readFeatureSource } from "../public-api-test-helpers"

const FEATURE_DIRECTORY_URL = new URL(".", import.meta.url)
const FEATURE_ALIAS = "@/features/database/ruler-group-maintenance"

describe("ruler-group-maintenance public API", () => {
  assertFeaturePublicApi({
    exportedNames: [
      "RulerGroupMaintenanceRouteComponent",
      "loadRulerGroupMaintenanceRouteData",
    ],
    feature,
    featureAlias: FEATURE_ALIAS,
    featureDirectoryUrl: FEATURE_DIRECTORY_URL,
  })

  it("keeps migrated Ruler Group reads and writes outside the database package boundary", () => {
    for (const file of [
      "actions.ts",
      "ruler-group-maintenance-route-data.ts",
    ]) {
      expect(readFeatureSource(FEATURE_DIRECTORY_URL, file)).not.toContain(
        "@coin-archive/db"
      )
    }

    const rulerRouteDataSource = readFeatureSource(
      new URL("../ruler-maintenance/", FEATURE_DIRECTORY_URL),
      "ruler-maintenance-route-data.ts"
    )
    expect(rulerRouteDataSource).toContain(
      "maintenanceClient.rulerGroups.options"
    )
    expect(rulerRouteDataSource).not.toContain(
      'import("@coin-archive/db").then(({ getRulerGroups })'
    )
  })
})
