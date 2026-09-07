import { describe } from "vitest"

import { assertFeaturePublicApi } from "../public-api-contract"
import * as feature from "./index"

describe("catalogue-maintenance public API", () => {
  assertFeaturePublicApi({
    exportedNames: [
      "CatalogueMaintenanceRouteComponent",
      "loadCatalogueMaintenanceRouteData",
    ],
    feature,
  })
})
