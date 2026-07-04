import { existsSync, readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

import * as issuerMaintenance from "./index"

const FEATURE_DIRECTORY = new URL(".", import.meta.url)

describe("issuer-maintenance public API", () => {
  it("only exposes the route-facing feature entrypoint", () => {
    expect(Object.keys(issuerMaintenance).sort()).toStrictEqual([
      "IssuerMaintenanceRouteComponent",
      "loadIssuerMaintenanceRouteData",
    ])
  })

  it("keeps a single root entrypoint and avoids internal self-imports through the feature alias", () => {
    const nestedEntryPoints = [
      "form-workflow/index.ts",
      "sheet-workflow/index.ts",
      "table-workflow/index.ts",
    ]
    const featureFiles = [
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

    for (const file of featureFiles) {
      const source = readFileSync(new URL(file, FEATURE_DIRECTORY), "utf8")

      expect(source).not.toContain('@/features/database/issuer-maintenance"')
      expect(source).not.toContain("@/features/database/issuer-maintenance'")
    }

    expect(
      nestedEntryPoints.filter((file) =>
        existsSync(new URL(file, FEATURE_DIRECTORY))
      )
    ).toStrictEqual([])
  })
})
