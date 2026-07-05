import { describe } from "vitest"

import * as feature from "./index"
import { assertFeaturePublicApi } from "../public-api-contract"

const FEATURE_DIRECTORY_URL = new URL(".", import.meta.url)
const FEATURE_ALIAS = "@/features/database/orientation-maintenance"
const FEATURE_SOURCE_FILES = [
  "actions.ts",
  "orientation-maintenance-page.tsx",
  "form-workflow/orientation-create-form.tsx",
  "form-workflow/orientation-edit-form.tsx",
  "form-workflow/orientation-form-fields.tsx",
  "sheet-workflow/orientation-maintenance-sheet.tsx",
  "table-workflow/columns.tsx",
  "table-workflow/orientations-table.tsx",
  "table-workflow/orientations-table-toolbar.tsx",
]

describe("orientation-maintenance public API", () => {
  assertFeaturePublicApi({
    exportedNames: [
      "OrientationMaintenanceRouteComponent",
      "loadOrientationMaintenanceRouteData",
    ],
    feature,
    featureAlias: FEATURE_ALIAS,
    featureDirectoryUrl: FEATURE_DIRECTORY_URL,
    featureSourceFiles: FEATURE_SOURCE_FILES,
  })
})
