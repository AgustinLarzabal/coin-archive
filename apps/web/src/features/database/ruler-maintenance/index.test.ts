import { describe } from "vitest"

import { assertFeaturePublicApi } from "../public-api-contract"
import * as feature from "./index"


describe("ruler-maintenance public API", () => {
  assertFeaturePublicApi({
    exportedNames: [
      "RulerMaintenanceRouteComponent",
      "loadRulerMaintenanceRouteData",
    ],
    feature,
  })
})
