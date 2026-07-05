import { describe } from "vitest"

import { assertFeaturePublicApi } from "../public-api-contract"
import * as rulerMaintenance from "./index"

const FEATURE_DIRECTORY_URL = new URL(".", import.meta.url)
const FEATURE_ALIAS = "@/features/database/ruler-maintenance"
const FEATURE_SOURCE_FILES = [
  "actions.ts",
  "columns.tsx",
  "ruler-create-form.tsx",
  "ruler-edit-form.tsx",
  "ruler-form-fields.tsx",
  "ruler-form.shared.ts",
  "ruler-maintenance-page.tsx",
  "ruler-maintenance-sheet.tsx",
  "rulers-table-toolbar.tsx",
  "rulers-table.tsx",
  "use-ruler-form-feedback.ts",
]

describe("ruler-maintenance public API", () => {
  assertFeaturePublicApi({
    exportedNames: [
      "RulerMaintenanceRouteComponent",
      "loadRulerMaintenanceRouteData",
    ],
    feature: rulerMaintenance,
    featureAlias: FEATURE_ALIAS,
    featureDirectoryUrl: FEATURE_DIRECTORY_URL,
    featureSourceFiles: FEATURE_SOURCE_FILES,
  })
})
