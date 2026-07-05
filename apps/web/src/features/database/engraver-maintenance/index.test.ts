import { describe } from "vitest"

import { assertFeaturePublicApi } from "../public-api-contract"
import * as engraverMaintenance from "./index"

const FEATURE_DIRECTORY_URL = new URL(".", import.meta.url)
const FEATURE_ALIAS = "@/features/database/engraver-maintenance"
const FEATURE_SOURCE_FILES = [
  "actions.ts",
  "columns.tsx",
  "engraver-create-form.tsx",
  "engraver-edit-form.tsx",
  "engraver-form.shared.ts",
  "engraver-maintenance-page.tsx",
  "engraver-maintenance-sheet.tsx",
  "engravers-table-toolbar.tsx",
  "engravers-table.tsx",
]

describe("engraver-maintenance public API", () => {
  assertFeaturePublicApi({
    exportedNames: [
      "EngraverMaintenanceRouteComponent",
      "loadEngraverMaintenanceRouteData",
    ],
    feature: engraverMaintenance,
    featureAlias: FEATURE_ALIAS,
    featureDirectoryUrl: FEATURE_DIRECTORY_URL,
    featureSourceFiles: FEATURE_SOURCE_FILES,
  })
})
