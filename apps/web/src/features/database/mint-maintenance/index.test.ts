import { describe } from "vitest"

import { assertFeaturePublicApi } from "../public-api-contract"
import * as mintMaintenance from "./index"

const FEATURE_DIRECTORY_URL = new URL(".", import.meta.url)
const FEATURE_ALIAS = "@/features/database/mint-maintenance"
const FEATURE_SOURCE_FILES = [
  "actions.ts",
  "columns.tsx",
  "mint-create-form.tsx",
  "mint-edit-form.tsx",
  "mint-form-fields.tsx",
  "mint-form.shared.ts",
  "mint-maintenance-page.tsx",
  "mint-maintenance-sheet.tsx",
  "mints-table-toolbar.tsx",
  "mints-table.tsx",
]

describe("mint-maintenance public API", () => {
  assertFeaturePublicApi({
    exportedNames: [
      "MintMaintenanceRouteComponent",
      "loadMintMaintenanceRouteData",
    ],
    feature: mintMaintenance,
    featureAlias: FEATURE_ALIAS,
    featureDirectoryUrl: FEATURE_DIRECTORY_URL,
    featureSourceFiles: FEATURE_SOURCE_FILES,
  })
})
