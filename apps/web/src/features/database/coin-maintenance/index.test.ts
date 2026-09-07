import { describe } from "vitest"

import { assertFeaturePublicApi } from "../public-api-contract"
import * as feature from "./index"

describe("coin-maintenance public API", () => {
  assertFeaturePublicApi({
    exportedNames: [
      "CoinCreateRouteComponent",
      "CoinEditRouteComponent",
      "CoinMaintenanceRouteComponent",
      "coinMaintenanceSearchSchema",
      "getCoinEditLoaderDeps",
      "getCoinMaintenanceLoaderDeps",
      "loadCoinCreateRouteData",
      "loadCoinEditRouteData",
      "loadCoinMaintenanceRouteData",
    ],
    feature,
  })
})
