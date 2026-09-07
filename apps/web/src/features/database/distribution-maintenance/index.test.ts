import { describe } from "vitest"

import { assertFeaturePublicApi } from "../public-api-contract"
import * as feature from "./index"


describe("distribution-maintenance public API", () => {
  assertFeaturePublicApi({
    exportedNames: [
      "DistributionMaintenanceRouteComponent",
      "loadDistributionMaintenanceRouteData",
    ],
    feature,
  })
})
