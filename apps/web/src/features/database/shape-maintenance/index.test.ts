import { describe } from "vitest"

import * as feature from "./index"
import { assertFeaturePublicApi } from "../public-api-contract"


describe("shape-maintenance public API", () => {
  assertFeaturePublicApi({
    exportedNames: [
      "ShapeMaintenanceRouteComponent",
      "loadShapeMaintenanceRouteData",
    ],
    feature,
  })
})
