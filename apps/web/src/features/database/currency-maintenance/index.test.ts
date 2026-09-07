import { describe } from "vitest"

import * as feature from "./index"
import { assertFeaturePublicApi } from "../public-api-contract"


describe("currency-maintenance public API", () => {
  assertFeaturePublicApi({
    exportedNames: [
      "CurrencyMaintenanceRouteComponent",
      "loadCurrencyMaintenanceRouteData",
    ],
    feature,
  })
})
