import { describe } from "vitest"

import * as feature from "./index"
import { assertFeaturePublicApi } from "../public-api-contract"


describe("minting-technique-maintenance public API", () => {
  assertFeaturePublicApi({
    exportedNames: [
      "MintingTechniqueMaintenanceRouteComponent",
      "loadMintingTechniqueMaintenanceRouteData",
    ],
    feature,
  })
})
