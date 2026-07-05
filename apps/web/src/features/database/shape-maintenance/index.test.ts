import { describe } from "vitest"

import * as feature from "./index"
import { assertFeaturePublicApi } from "../public-api-contract"

const FEATURE_DIRECTORY_URL = new URL(".", import.meta.url)
const FEATURE_ALIAS = "@/features/database/shape-maintenance"
const FEATURE_SOURCE_FILES = [
  "actions.ts",
  "shape-maintenance-page.tsx",
  "form-workflow/shape-create-form.tsx",
  "form-workflow/shape-edit-form.tsx",
  "form-workflow/shape-form-fields.tsx",
  "sheet-workflow/shape-maintenance-sheet.tsx",
  "table-workflow/columns.tsx",
  "table-workflow/shapes-table.tsx",
  "table-workflow/shapes-table-toolbar.tsx",
]

describe("shape-maintenance public API", () => {
  assertFeaturePublicApi({
    exportedNames: [
      "ShapeMaintenanceRouteComponent",
      "loadShapeMaintenanceRouteData",
    ],
    feature,
    featureAlias: FEATURE_ALIAS,
    featureDirectoryUrl: FEATURE_DIRECTORY_URL,
    featureSourceFiles: FEATURE_SOURCE_FILES,
  })
})
