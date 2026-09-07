import { describe } from "vitest"

import { assertFeaturePublicApi } from "../public-api-contract"
import * as feature from "./index"

describe("database-overview public API", () => {
  assertFeaturePublicApi({
    exportedNames: [
      "DatabaseOverviewRouteComponent",
      "loadDatabaseOverviewRouteData",
    ],
    feature,
  })
})
