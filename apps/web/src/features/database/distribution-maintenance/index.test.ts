import { describe } from "vitest"

import * as feature from "./index"
import { assertFeaturePublicApi } from "../public-api-contract"

const FEATURE_DIRECTORY_URL = new URL(".", import.meta.url)
const FEATURE_ALIAS = "@/features/database/distribution-maintenance"

describe("distribution-maintenance public API", () => {
  assertFeaturePublicApi({
    exportedNames: [
      "DistributionMaintenanceRouteComponent",
      "loadDistributionMaintenanceRouteData",
    ],
    feature,
    featureAlias: FEATURE_ALIAS,
    featureDirectoryUrl: FEATURE_DIRECTORY_URL,
  })
})
