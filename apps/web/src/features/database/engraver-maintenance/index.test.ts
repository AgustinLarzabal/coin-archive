import { describe, expect, it } from "vitest"

import * as feature from "./index"
import { assertFeaturePublicApi } from "../public-api-contract"
import { readFeatureSource } from "../public-api-test-helpers"

const FEATURE_DIRECTORY_URL = new URL(".", import.meta.url)
const FEATURE_ALIAS = "@/features/database/engraver-maintenance"

describe("engraver-maintenance public API", () => {
  assertFeaturePublicApi({
    exportedNames: [
      "EngraverMaintenanceRouteComponent",
      "loadEngraverMaintenanceRouteData",
    ],
    feature,
    featureAlias: FEATURE_ALIAS,
    featureDirectoryUrl: FEATURE_DIRECTORY_URL,
  })

  it("keeps migrated Engraver reads and writes outside the database package boundary", () => {
    for (const file of ["actions.ts", "engraver-maintenance-route-data.ts"]) {
      expect(readFeatureSource(FEATURE_DIRECTORY_URL, file)).not.toContain(
        "@coin-archive/db"
      )
    }

    const coinFormSource = readFeatureSource(
      new URL("../coin-maintenance/editor/", FEATURE_DIRECTORY_URL),
      "coin-form.shared.ts"
    )
    expect(coinFormSource).toContain("maintenanceClient.engravers.options")
    expect(coinFormSource).not.toMatch(/\n\s+getEngravers,/)
  })
})
