import { describe } from "vitest"

import { assertFeaturePublicApi } from "../public-api-contract"
import * as feature from "./index"

const FEATURE_DIRECTORY_URL = new URL(".", import.meta.url)
const FEATURE_ALIAS = "@/features/database/coin-maintenance"

describe("coin-maintenance public API", () => {
  assertFeaturePublicApi({
    exportedNames: [
      "CoinMaintenanceRouteComponent",
      "coinMaintenanceSearchSchema",
      "getCoinMaintenanceLoaderDeps",
      "loadCoinMaintenanceRouteData",
    ],
    feature,
    featureAlias: FEATURE_ALIAS,
    featureDirectoryUrl: FEATURE_DIRECTORY_URL,
  })
})
