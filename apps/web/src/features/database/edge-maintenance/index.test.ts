import { describe } from "vitest"

import * as feature from "./index"
import { assertFeaturePublicApi } from "../public-api-contract"

const FEATURE_DIRECTORY_URL = new URL(".", import.meta.url)
const FEATURE_ALIAS = "@/features/database/edge-maintenance"
const FEATURE_SOURCE_FILES = [
  "actions.ts",
  "edge-maintenance-page.tsx",
  "form-workflow/edge-create-form.tsx",
  "form-workflow/edge-edit-form.tsx",
  "sheet-workflow/edge-maintenance-sheet.tsx",
  "table-workflow/columns.tsx",
  "table-workflow/edges-table.tsx",
  "table-workflow/edges-table-toolbar.tsx",
]

describe("edge-maintenance public API", () => {
  assertFeaturePublicApi({
    exportedNames: [
      "EdgeMaintenanceRouteComponent",
      "loadEdgeMaintenanceRouteData",
    ],
    feature,
    featureAlias: FEATURE_ALIAS,
    featureDirectoryUrl: FEATURE_DIRECTORY_URL,
    featureSourceFiles: FEATURE_SOURCE_FILES,
  })
})
