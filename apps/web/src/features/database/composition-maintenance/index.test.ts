import { describe } from "vitest"

import { assertFeaturePublicApi } from "../public-api-contract"
import * as feature from "./index"


describe("composition-maintenance public API", () => {
  assertFeaturePublicApi({
    exportedNames: [
      "CompositionMaintenanceRouteComponent",
      "loadCompositionMaintenanceRouteData",
    ],
    feature,
  })
})
