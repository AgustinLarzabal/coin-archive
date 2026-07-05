import { existsSync, readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

import * as compositionMaintenance from "./index"

const FEATURE_DIRECTORY_URL = new URL(".", import.meta.url)
const FEATURE_ALIAS = "@/features/database/composition-maintenance"
const DELETED_NESTED_ENTRYPOINTS = [
  "form-workflow/index.ts",
  "sheet-workflow/index.ts",
  "table-workflow/index.ts",
]
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

function readFeatureSource(filePath: string) {
  return readFileSync(new URL(filePath, FEATURE_DIRECTORY_URL), "utf8")
}

describe("composition-maintenance public API", () => {
  it("only exposes the route-facing feature entrypoint", () => {
    expect(Object.keys(compositionMaintenance).sort()).toStrictEqual([
      "CompositionMaintenanceRouteComponent",
      "loadCompositionMaintenanceRouteData",
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
