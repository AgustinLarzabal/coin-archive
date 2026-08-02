import { describe, expect, it } from "vitest"

import { assertFeaturePublicApi } from "../public-api-contract"
import { readFeatureSource } from "../public-api-test-helpers"
import * as feature from "./index"

const FEATURE_DIRECTORY_URL = new URL(".", import.meta.url)
const FEATURE_ALIAS = "@/features/database/composition-maintenance"

describe("composition-maintenance public API", () => {
  assertFeaturePublicApi({
    exportedNames: [
      "CompositionMaintenanceRouteComponent",
      "loadCompositionMaintenanceRouteData",
    ],
    feature,
    featureAlias: FEATURE_ALIAS,
    featureDirectoryUrl: FEATURE_DIRECTORY_URL,
  })

  it("keeps migrated Composition reads and writes outside the database package boundary", () => {
    for (const file of [
      "actions.ts",
      "composition-maintenance-route-data.ts",
    ]) {
      expect(readFeatureSource(FEATURE_DIRECTORY_URL, file)).not.toContain(
        "@coin-archive/db"
      )
    }

    const coinFormSource = readFeatureSource(
      new URL("../coin-maintenance/editor/", FEATURE_DIRECTORY_URL),
      "coin-form.shared.ts"
    )
    expect(coinFormSource).toContain("maintenanceClient.compositions.options")
    expect(coinFormSource).not.toMatch(/\n\s+getCompositions,/)

    const listingSource = readFeatureSource(
      new URL("../coin-maintenance/listing/", FEATURE_DIRECTORY_URL),
      "coin-maintenance-route-data.ts"
    )
    expect(listingSource).toContain("maintenanceClient.compositions.options")
  })
})
