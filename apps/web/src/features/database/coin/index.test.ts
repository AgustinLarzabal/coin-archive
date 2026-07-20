import { describe } from "vitest"

import { assertFeaturePublicApi } from "../public-api-contract"
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
})
