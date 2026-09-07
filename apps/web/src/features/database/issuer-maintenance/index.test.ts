import { describe } from "vitest"

import { assertFeaturePublicApi } from "../public-api-contract"
import * as feature from "./index"


describe("issuer-maintenance public API", () => {
  assertFeaturePublicApi({
    exportedNames: [
      "IssuerMaintenanceRouteComponent",
      "loadIssuerMaintenanceRouteData",
    ],
    feature,
  })
})
