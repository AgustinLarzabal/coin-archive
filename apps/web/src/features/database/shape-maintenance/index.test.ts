import { existsSync, readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

import * as feature from "./index"

const FEATURE_DIRECTORY_URL = new URL(".", import.meta.url)
const FEATURE_ALIAS = "@/features/database/shape-maintenance"
const DELETED_NESTED_ENTRYPOINTS = [
  "form-workflow/index.ts",
  "sheet-workflow/index.ts",
  "table-workflow/index.ts",
]
const FEATURE_SOURCE_FILES = [
  "actions.ts",
  "shape-maintenance-page.tsx",
  "form-workflow/shape-create-form.tsx",
  "form-workflow/shape-edit-form.tsx",
  "form-workflow/shape-form-fields.tsx",
  "sheet-workflow/shape-maintenance-sheet.tsx",
  "table-workflow/columns.tsx",
  "table-workflow/shapes-table.tsx",
  "table-workflow/shapes-table-toolbar.tsx",
]

function readFeatureSource(filePath: string) {
  return readFileSync(new URL(filePath, FEATURE_DIRECTORY_URL), "utf8")
}

describe("shape-maintenance public API", () => {
  it("only exposes the route-facing feature entrypoint", () => {
    expect(Object.keys(feature).sort()).toStrictEqual([
      "ShapeMaintenanceRouteComponent",
      "loadShapeMaintenanceRouteData",
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
