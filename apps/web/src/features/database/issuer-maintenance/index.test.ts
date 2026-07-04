import { existsSync, readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

import * as issuerMaintenance from "./index"

const FEATURE_DIRECTORY_URL = new URL(".", import.meta.url)
const FEATURE_ALIAS = "@/features/database/issuer-maintenance"
const DELETED_NESTED_ENTRYPOINTS = [
  "form-workflow/index.ts",
  "sheet-workflow/index.ts",
  "table-workflow/index.ts",
]
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

function readFeatureSource(filePath: string) {
  return readFileSync(new URL(filePath, FEATURE_DIRECTORY_URL), "utf8")
}

describe("issuer-maintenance public API", () => {
  it("only exposes the route-facing feature entrypoint", () => {
    expect(Object.keys(issuerMaintenance).sort()).toStrictEqual([
      "IssuerMaintenanceRouteComponent",
      "loadIssuerMaintenanceRouteData",
    ])
  })

  it("avoids internal self-imports through the feature alias", () => {
    for (const filePath of FEATURE_SOURCE_FILES) {
      expect(readFeatureSource(filePath)).not.toMatch(FEATURE_ALIAS)
    }
  })

  it("keeps the feature entrypoint at the root only", () => {
    expect(
      DELETED_NESTED_ENTRYPOINTS.filter((filePath) =>
        existsSync(new URL(filePath, FEATURE_DIRECTORY_URL))
      )
    ).toStrictEqual([])
  })
})
