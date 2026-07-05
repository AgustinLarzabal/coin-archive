import { describe } from "vitest"

import { assertFeaturePublicApi } from "../public-api-contract"
import * as rulerGroupMaintenance from "./index"

const FEATURE_DIRECTORY_URL = new URL(".", import.meta.url)
const FEATURE_ALIAS = "@/features/database/ruler-group-maintenance"
const FEATURE_SOURCE_FILES = [
  "actions.ts",
  "columns.tsx",
  "ruler-group-create-form.tsx",
  "ruler-group-edit-form.tsx",
  "ruler-group-form-fields.tsx",
  "ruler-group-form.shared.ts",
  "ruler-group-maintenance-page.tsx",
  "ruler-group-maintenance-sheet.tsx",
  "ruler-groups-table-toolbar.tsx",
  "ruler-groups-table.tsx",
]

describe("ruler-group-maintenance public API", () => {
  assertFeaturePublicApi({
    exportedNames: [
      "RulerGroupMaintenanceRouteComponent",
      "loadRulerGroupMaintenanceRouteData",
    ],
    feature: rulerGroupMaintenance,
    featureAlias: FEATURE_ALIAS,
    featureDirectoryUrl: FEATURE_DIRECTORY_URL,
    featureSourceFiles: FEATURE_SOURCE_FILES,
  })
})
