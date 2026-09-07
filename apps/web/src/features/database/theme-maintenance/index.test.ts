import { describe } from "vitest"

import * as feature from "./index"
import { assertFeaturePublicApi } from "../public-api-contract"


describe("theme-maintenance public API", () => {
  assertFeaturePublicApi({
    exportedNames: [
      "ThemeMaintenanceRouteComponent",
      "loadThemeMaintenanceRouteData",
    ],
    feature,
  })
})
