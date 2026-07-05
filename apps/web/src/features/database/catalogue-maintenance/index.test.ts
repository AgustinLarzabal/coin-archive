import { existsSync, readdirSync, readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

import * as catalogueMaintenance from "./index"

const FEATURE_DIRECTORY_URL = new URL(".", import.meta.url)
const FEATURE_ALIAS = "@/features/database/catalogue-maintenance"

function getFeatureSourceFiles(directoryUrl: URL, prefix = ""): string[] {
  return readdirSync(directoryUrl, { withFileTypes: true }).flatMap((entry) => {
    const nextPath = prefix ? `${prefix}/${entry.name}` : entry.name

    if (entry.isDirectory()) {
      return getFeatureSourceFiles(new URL(`${entry.name}/`, directoryUrl), nextPath)
    }

    if (!entry.name.endsWith(".ts") && !entry.name.endsWith(".tsx")) {
      return []
    }

    return [nextPath]
  })
}

function readFeatureSource(filePath: string) {
  return readFileSync(new URL(filePath, FEATURE_DIRECTORY_URL), "utf8")
}

describe("catalogue-maintenance public API", () => {
  it("only exposes the route-facing feature entrypoint", () => {
    expect(Object.keys(catalogueMaintenance).sort()).toStrictEqual([
      "CatalogueMaintenanceRouteComponent",
      "loadCatalogueMaintenanceRouteData",
    ])
  })

  it("avoids internal self-imports through the feature alias", () => {
    for (const filePath of getFeatureSourceFiles(FEATURE_DIRECTORY_URL)) {
      if (filePath === "index.test.ts" || filePath.endsWith(".test.tsx")) {
        continue
      }

      expect(readFeatureSource(filePath)).not.toMatch(FEATURE_ALIAS)
    }
  })

  it("keeps the feature entrypoint at the root only", () => {
    expect(
      getFeatureSourceFiles(FEATURE_DIRECTORY_URL).filter(
        (filePath) => filePath !== "index.ts" && filePath.endsWith("/index.ts")
      )
    ).toStrictEqual([])
    expect(existsSync(new URL("index.ts", FEATURE_DIRECTORY_URL))).toBe(true)
  })
})
