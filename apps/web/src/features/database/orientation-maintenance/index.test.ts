import { describe, expect, it } from "vitest"

import * as feature from "./index"
import { assertFeaturePublicApi } from "../public-api-contract"
import { readFeatureSource } from "../public-api-test-helpers"

const FEATURE_DIRECTORY_URL = new URL(".", import.meta.url)
const FEATURE_ALIAS = "@/features/database/orientation-maintenance"

describe("orientation-maintenance public API", () => {
  assertFeaturePublicApi({
    exportedNames: [
      "OrientationMaintenanceRouteComponent",
      "loadOrientationMaintenanceRouteData",
    ],
    feature,
    featureAlias: FEATURE_ALIAS,
    featureDirectoryUrl: FEATURE_DIRECTORY_URL,
  })

  it("keeps migrated Orientation reads and writes outside the database package boundary", () => {
    for (const file of [
      "actions.ts",
      "orientation-maintenance-route-data.ts",
    ]) {
      expect(readFeatureSource(FEATURE_DIRECTORY_URL, file)).not.toContain(
        "@coin-archive/db"
      )
    }
  })
})
