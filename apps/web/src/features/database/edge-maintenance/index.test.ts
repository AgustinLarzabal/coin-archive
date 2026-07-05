import { describe } from "vitest"

import * as feature from "./index"
import { assertFeaturePublicApi } from "../public-api-contract"

const FEATURE_DIRECTORY_URL = new URL(".", import.meta.url)
const FEATURE_ALIAS = "@/features/database/edge-maintenance"

describe("edge-maintenance public API", () => {
  assertFeaturePublicApi({
    exportedNames: [
      "EdgeMaintenanceRouteComponent",
      "loadEdgeMaintenanceRouteData",
    ],
    feature,
    featureAlias: FEATURE_ALIAS,
    featureDirectoryUrl: FEATURE_DIRECTORY_URL,
  })
})
