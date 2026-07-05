import { describe } from "vitest"

import * as feature from "./index"
import { assertFeaturePublicApi } from "../public-api-contract"

const FEATURE_DIRECTORY_URL = new URL(".", import.meta.url)
const FEATURE_ALIAS = "@/features/database/currency-maintenance"
const FEATURE_SOURCE_FILES = [
  "actions.ts",
  "currency-maintenance-page.tsx",
  "form-workflow/currency-create-form.tsx",
  "form-workflow/currency-edit-form.tsx",
  "sheet-workflow/currency-maintenance-sheet.tsx",
  "table-workflow/columns.tsx",
  "table-workflow/currencies-table.tsx",
  "table-workflow/currencies-table-toolbar.tsx",
]

describe("currency-maintenance public API", () => {
  assertFeaturePublicApi({
    exportedNames: [
      "CurrencyMaintenanceRouteComponent",
      "loadCurrencyMaintenanceRouteData",
    ],
    feature,
    featureAlias: FEATURE_ALIAS,
    featureDirectoryUrl: FEATURE_DIRECTORY_URL,
    featureSourceFiles: FEATURE_SOURCE_FILES,
  })
})
