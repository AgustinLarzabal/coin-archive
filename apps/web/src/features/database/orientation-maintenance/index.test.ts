import { describe } from "vitest"

import * as feature from "./index"
import { assertFeaturePublicApi } from "../public-api-contract"

const FEATURE_DIRECTORY_URL = new URL(".", import.meta.url)
const FEATURE_ALIAS = "@/features/database/orientation-maintenance"

describe("orientation-maintenance public API", () => {
  assertFeaturePublicApi({
    exportedNames: [
      "OrientationMaintenanceRouteComponent",
      "loadOrientationMaintenanceRouteData",
    ],
    feature,
    featureAlias: FEATURE_ALIAS,
    featureDirectoryUrl: FEATURE_DIRECTORY_URL,
  })
})
