import { existsSync, readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

import * as feature from "./index"

const FEATURE_DIRECTORY_URL = new URL(".", import.meta.url)
const FEATURE_ALIAS = "@/features/database/orientation-maintenance"
const DELETED_NESTED_ENTRYPOINTS = [
  "form-workflow/index.ts",
  "sheet-workflow/index.ts",
  "table-workflow/index.ts",
]
const FEATURE_SOURCE_FILES = [
  "actions.ts",
  "orientation-maintenance-page.tsx",
  "form-workflow/orientation-create-form.tsx",
  "form-workflow/orientation-edit-form.tsx",
  "form-workflow/orientation-form-fields.tsx",
  "sheet-workflow/orientation-maintenance-sheet.tsx",
  "table-workflow/columns.tsx",
  "table-workflow/orientations-table.tsx",
  "table-workflow/orientations-table-toolbar.tsx",
]

function readFeatureSource(filePath: string) {
  return readFileSync(new URL(filePath, FEATURE_DIRECTORY_URL), "utf8")
}

describe("orientation-maintenance public API", () => {
  it("only exposes the route-facing feature entrypoint", () => {
    expect(Object.keys(feature).sort()).toStrictEqual([
      "OrientationMaintenanceRouteComponent",
      "loadOrientationMaintenanceRouteData",
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
