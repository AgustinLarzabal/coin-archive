import { describe } from "vitest"

import * as feature from "./index"
import { assertFeaturePublicApi } from "../public-api-contract"

const FEATURE_DIRECTORY_URL = new URL(".", import.meta.url)
const FEATURE_ALIAS = "@/features/database/rim-maintenance"
const FEATURE_SOURCE_FILES = [
  "actions.ts",
  "rim-maintenance-page.tsx",
  "form-workflow/rim-create-form.tsx",
  "form-workflow/rim-edit-form.tsx",
  "form-workflow/rim-form-fields.tsx",
  "sheet-workflow/rim-maintenance-sheet.tsx",
  "table-workflow/columns.tsx",
  "table-workflow/rims-table.tsx",
  "table-workflow/rims-table-toolbar.tsx",
]

describe("rim-maintenance public API", () => {
  assertFeaturePublicApi({
    exportedNames: [
      "RimMaintenanceRouteComponent",
      "loadRimMaintenanceRouteData",
    ],
    feature,
    featureAlias: FEATURE_ALIAS,
    featureDirectoryUrl: FEATURE_DIRECTORY_URL,
    featureSourceFiles: FEATURE_SOURCE_FILES,
  })
})
