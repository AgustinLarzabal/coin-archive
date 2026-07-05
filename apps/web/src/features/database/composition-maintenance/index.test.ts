import { describe } from "vitest"

import * as compositionMaintenance from "./index"
import { assertFeaturePublicApi } from "../public-api-contract"

const FEATURE_DIRECTORY_URL = new URL(".", import.meta.url)
const FEATURE_ALIAS = "@/features/database/composition-maintenance"
const FEATURE_SOURCE_FILES = [
  "actions.ts",
  "composition-maintenance-page.tsx",
  "form-workflow/composition-create-form.tsx",
  "form-workflow/composition-edit-form.tsx",
  "messages.ts",
  "sheet-workflow/composition-maintenance-sheet.tsx",
  "table-workflow/columns.tsx",
  "table-workflow/compositions-table.tsx",
  "table-workflow/compositions-table-toolbar.tsx",
  "validation.ts",
]

describe("composition-maintenance public API", () => {
  assertFeaturePublicApi({
    exportedNames: [
      "CompositionMaintenanceRouteComponent",
      "loadCompositionMaintenanceRouteData",
    ],
    feature: compositionMaintenance,
    featureAlias: FEATURE_ALIAS,
    featureDirectoryUrl: FEATURE_DIRECTORY_URL,
    featureSourceFiles: FEATURE_SOURCE_FILES,
  })
})
