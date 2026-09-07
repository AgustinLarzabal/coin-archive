import { describe } from "vitest"

import * as feature from "./index"
import { assertFeaturePublicApi } from "../public-api-contract"


describe("ruler-group-maintenance public API", () => {
  assertFeaturePublicApi({
    exportedNames: [
      "RulerGroupMaintenanceRouteComponent",
      "loadRulerGroupMaintenanceRouteData",
    ],
    feature,
  })
})
