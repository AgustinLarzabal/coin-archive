import { describe } from "vitest"

import * as feature from "./index"
import { assertFeaturePublicApi } from "../public-api-contract"


describe("orientation-maintenance public API", () => {
  assertFeaturePublicApi({
    exportedNames: [
      "OrientationMaintenanceRouteComponent",
      "loadOrientationMaintenanceRouteData",
    ],
    feature,
  })
})
