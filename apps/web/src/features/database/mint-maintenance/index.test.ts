import { describe } from "vitest"

import * as feature from "./index"
import { assertFeaturePublicApi } from "../public-api-contract"


describe("mint-maintenance public API", () => {
  assertFeaturePublicApi({
    exportedNames: [
      "MintMaintenanceRouteComponent",
      "loadMintMaintenanceRouteData",
    ],
    feature,
  })
})
