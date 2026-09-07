import { describe } from "vitest"

import * as feature from "./index"
import { assertFeaturePublicApi } from "../public-api-contract"


describe("rim-maintenance public API", () => {
  assertFeaturePublicApi({
    exportedNames: [
      "RimMaintenanceRouteComponent",
      "loadRimMaintenanceRouteData",
    ],
    feature,
  })
})
