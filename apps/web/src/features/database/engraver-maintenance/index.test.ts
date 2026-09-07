import { describe } from "vitest"

import * as feature from "./index"
import { assertFeaturePublicApi } from "../public-api-contract"


describe("engraver-maintenance public API", () => {
  assertFeaturePublicApi({
    exportedNames: [
      "EngraverMaintenanceRouteComponent",
      "loadEngraverMaintenanceRouteData",
    ],
    feature,
  })
})
