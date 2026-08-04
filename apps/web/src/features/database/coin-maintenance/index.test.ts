import { describe, expect, it } from "vitest"

import { assertFeaturePublicApi } from "../public-api-contract"
import { readFeatureSource } from "../public-api-test-helpers"
import * as feature from "./index"

const FEATURE_DIRECTORY_URL = new URL(".", import.meta.url)
const FEATURE_ALIAS = "@/features/database/coin-maintenance"

describe("coin-maintenance public API", () => {
  assertFeaturePublicApi({
    exportedNames: [
      "CoinCreateRouteComponent",
      "CoinEditRouteComponent",
      "CoinMaintenanceRouteComponent",
      "coinMaintenanceSearchSchema",
      "getCoinEditLoaderDeps",
      "getCoinMaintenanceLoaderDeps",
      "loadCoinCreatePageData",
      "loadCoinCreateRouteData",
      "loadCoinEditPageData",
      "loadCoinEditRouteData",
      "loadCoinMaintenanceRouteData",
    ],
    feature,
    featureAlias: FEATURE_ALIAS,
    featureDirectoryUrl: FEATURE_DIRECTORY_URL,
  })

  it("keeps migrated Coin deletion outside the database package boundary", () => {
    const actions = readFeatureSource(FEATURE_DIRECTORY_URL, "actions.ts")

    expect(actions).toContain("client.coins.delete")
    expect(actions).not.toContain('@coin-archive/db"')
    expect(actions).not.toContain("deletePublishedImage")
  })
})
