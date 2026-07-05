import { describe } from "vitest"

import * as feature from "./index"
import { assertFeaturePublicApi } from "../public-api-contract"

const FEATURE_DIRECTORY_URL = new URL(".", import.meta.url)
const FEATURE_ALIAS = "@/features/database/theme-maintenance"
const FEATURE_SOURCE_FILES = [
  "actions.ts",
  "theme-maintenance-page.tsx",
  "form-workflow/theme-create-form.tsx",
  "form-workflow/theme-edit-form.tsx",
  "form-workflow/theme-form-fields.tsx",
  "sheet-workflow/theme-maintenance-sheet.tsx",
  "table-workflow/columns.tsx",
  "table-workflow/themes-table.tsx",
  "table-workflow/themes-table-toolbar.tsx",
]

describe("theme-maintenance public API", () => {
  assertFeaturePublicApi({
    exportedNames: [
      "ThemeMaintenanceRouteComponent",
      "loadThemeMaintenanceRouteData",
    ],
    feature,
    featureAlias: FEATURE_ALIAS,
    featureDirectoryUrl: FEATURE_DIRECTORY_URL,
    featureSourceFiles: FEATURE_SOURCE_FILES,
  })
})
