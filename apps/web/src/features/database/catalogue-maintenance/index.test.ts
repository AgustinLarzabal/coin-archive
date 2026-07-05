import { describe } from "vitest"

import { assertFeaturePublicApi } from "../public-api-contract"
import * as catalogueMaintenance from "./index"

const FEATURE_DIRECTORY_URL = new URL(".", import.meta.url)
const FEATURE_ALIAS = "@/features/database/catalogue-maintenance"
const FEATURE_SOURCE_FILES = [
  "actions.ts",
  "catalogue-maintenance-page.tsx",
  "form-workflow/catalogue-create-form.tsx",
  "form-workflow/catalogue-edit-form.tsx",
  "sheet-workflow/catalogue-edit-sheet.tsx",
  "table-workflow/catalogues-table.tsx",
  "table-workflow/catalogues-table-toolbar.tsx",
  "table-workflow/columns.tsx",
]

describe("catalogue-maintenance public API", () => {
  assertFeaturePublicApi({
    exportedNames: [
      "CatalogueMaintenanceRouteComponent",
      "loadCatalogueMaintenanceRouteData",
    ],
    feature: catalogueMaintenance,
    featureAlias: FEATURE_ALIAS,
    featureDirectoryUrl: FEATURE_DIRECTORY_URL,
    featureSourceFiles: FEATURE_SOURCE_FILES,
  })
})
