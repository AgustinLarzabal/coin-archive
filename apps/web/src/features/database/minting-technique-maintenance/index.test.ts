import { describe } from "vitest"

import * as feature from "./index"
import { assertFeaturePublicApi } from "../public-api-contract"

const FEATURE_DIRECTORY_URL = new URL(".", import.meta.url)
const FEATURE_ALIAS = "@/features/database/minting-technique-maintenance"

describe("minting-technique-maintenance public API", () => {
  assertFeaturePublicApi({
    exportedNames: [
      "MintingTechniqueMaintenanceRouteComponent",
      "loadMintingTechniqueMaintenanceRouteData",
    ],
    feature,
    featureAlias: FEATURE_ALIAS,
    featureDirectoryUrl: FEATURE_DIRECTORY_URL,
  })
})
