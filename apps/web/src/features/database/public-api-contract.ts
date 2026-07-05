import { existsSync } from "node:fs"

import { expect, it } from "vitest"

import {
  getFeatureSourceFiles,
  readFeatureSource,
} from "./public-api-test-helpers"

type PublicApiContractOptions = {
  deletedNestedEntrypoints?: readonly string[]
  exportedNames: readonly string[]
  feature: Record<string, unknown>
  featureAlias: string
  featureDirectoryUrl: URL
  featureSourceFiles?: readonly string[]
}

const DEFAULT_DELETED_NESTED_ENTRYPOINTS = [
  "form-workflow/index.ts",
  "sheet-workflow/index.ts",
  "table-workflow/index.ts",
] as const
const TEST_FILE_PATTERN = /\.test\.(ts|tsx)$/

export function assertFeaturePublicApi({
  deletedNestedEntrypoints = DEFAULT_DELETED_NESTED_ENTRYPOINTS,
  exportedNames,
  feature,
  featureAlias,
  featureDirectoryUrl,
  featureSourceFiles = getFeatureSourceFiles(featureDirectoryUrl, true).filter(
    (filePath) => filePath !== "index.ts" && !TEST_FILE_PATTERN.test(filePath)
  ),
}: PublicApiContractOptions) {
  it("only exposes the route-facing feature entrypoint", () => {
    expect(Object.keys(feature).sort()).toStrictEqual(exportedNames)
  })

  it("avoids internal self-imports through the feature alias", () => {
    for (const filePath of featureSourceFiles) {
      expect(readFeatureSource(featureDirectoryUrl, filePath)).not.toMatch(
        featureAlias
      )
    }
  })

  it("keeps the feature entrypoint at the root only", () => {
    expect(
      deletedNestedEntrypoints.filter((filePath) =>
        existsSync(new URL(filePath, featureDirectoryUrl))
      )
    ).toStrictEqual([])
  })
}
