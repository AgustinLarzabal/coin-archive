import { describe } from "vitest"

import * as issuerMaintenance from "./index"
import { assertFeaturePublicApi } from "../public-api-contract"

const FEATURE_DIRECTORY_URL = new URL(".", import.meta.url)
const FEATURE_ALIAS = "@/features/database/issuer-maintenance"
const FEATURE_SOURCE_FILES = [
  "actions.ts",
  "form-workflow/issuer-create-form.tsx",
  "form-workflow/issuer-edit-form.tsx",
  "form-workflow/issuer-form.shared.ts",
  "issuer-maintenance-page.tsx",
  "messages.ts",
  "sheet-workflow/issuer-maintenance-sheet.tsx",
  "table-workflow/columns.tsx",
  "table-workflow/issuers-table.tsx",
  "table-workflow/issuers-table-toolbar.tsx",
  "validation.ts",
]

describe("issuer-maintenance public API", () => {
  assertFeaturePublicApi({
    exportedNames: [
      "IssuerMaintenanceRouteComponent",
      "loadIssuerMaintenanceRouteData",
    ],
    feature: issuerMaintenance,
    featureAlias: FEATURE_ALIAS,
    featureDirectoryUrl: FEATURE_DIRECTORY_URL,
    featureSourceFiles: FEATURE_SOURCE_FILES,
  })
})
