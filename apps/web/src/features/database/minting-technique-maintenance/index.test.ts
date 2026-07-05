import { describe } from "vitest"

import * as feature from "./index"
import { assertFeaturePublicApi } from "../public-api-contract"

const FEATURE_DIRECTORY_URL = new URL(".", import.meta.url)
const FEATURE_ALIAS = "@/features/database/minting-technique-maintenance"
const FEATURE_SOURCE_FILES = [
  "actions.ts",
  "minting-technique-maintenance-page.tsx",
  "form-workflow/minting-technique-create-form.tsx",
  "form-workflow/minting-technique-edit-form.tsx",
  "form-workflow/minting-technique-form-fields.tsx",
  "sheet-workflow/minting-technique-maintenance-sheet.tsx",
  "table-workflow/columns.tsx",
  "table-workflow/minting-techniques-table.tsx",
  "table-workflow/minting-techniques-table-toolbar.tsx",
]

describe("minting-technique-maintenance public API", () => {
  assertFeaturePublicApi({
    exportedNames: [
      "MintingTechniqueMaintenanceRouteComponent",
      "loadMintingTechniqueMaintenanceRouteData",
    ],
    feature,
    featureAlias: FEATURE_ALIAS,
    featureDirectoryUrl: FEATURE_DIRECTORY_URL,
    featureSourceFiles: FEATURE_SOURCE_FILES,
  })
})
