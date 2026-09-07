import { describe } from "vitest"

import * as feature from "./index"
import { assertFeaturePublicApi } from "../public-api-contract"


describe("edge-maintenance public API", () => {
  assertFeaturePublicApi({
    exportedNames: [
      "EdgeMaintenanceRouteComponent",
      "loadEdgeMaintenanceRouteData",
    ],
    feature,
  })
})
