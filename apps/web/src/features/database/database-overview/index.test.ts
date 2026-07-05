import { existsSync, readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

import * as databaseOverview from "./index"

const FEATURE_DIRECTORY_URL = new URL(".", import.meta.url)
const FEATURE_ALIAS = "@/features/database/database-overview"
const DELETED_NESTED_ENTRYPOINTS = ["page/index.ts", "table/index.ts"] as const
const FEATURE_SOURCE_FILES = [
  "database-overview-page.tsx",
  "database-overview-table.tsx",
] as const

function readFeatureSource(filePath: string) {
  return readFileSync(new URL(filePath, FEATURE_DIRECTORY_URL), "utf8")
}

describe("database-overview public API", () => {
  it("only exposes the route-facing feature entrypoint", () => {
    expect(Object.keys(databaseOverview).sort()).toStrictEqual([
      "DatabaseOverviewRouteComponent",
      "loadDatabaseOverviewRouteData",
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
