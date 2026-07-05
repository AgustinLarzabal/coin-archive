import { describe } from "vitest"

import * as feature from "./index"
import { assertFeaturePublicApi } from "../public-api-contract"

const FEATURE_DIRECTORY_URL = new URL(".", import.meta.url)
const FEATURE_ALIAS = "@/features/database/distribution-maintenance"
const FEATURE_SOURCE_FILES = [
  "actions.ts",
  "distribution-maintenance-page.tsx",
  "form-workflow/distribution-create-form.tsx",
  "form-workflow/distribution-edit-form.tsx",
  "sheet-workflow/distribution-maintenance-sheet.tsx",
  "table-workflow/columns.tsx",
  "table-workflow/distributions-table.tsx",
  "table-workflow/distributions-table-toolbar.tsx",
]

describe("distribution-maintenance public API", () => {
  assertFeaturePublicApi({
    exportedNames: [
      "DistributionMaintenanceRouteComponent",
      "loadDistributionMaintenanceRouteData",
    ],
    feature,
    featureAlias: FEATURE_ALIAS,
    featureDirectoryUrl: FEATURE_DIRECTORY_URL,
    featureSourceFiles: FEATURE_SOURCE_FILES,
  })
})
