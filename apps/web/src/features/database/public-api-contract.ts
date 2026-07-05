import { existsSync, readFileSync } from "node:fs"

import { expect, it } from "vitest"

type PublicApiContractOptions = {
  exportedNames: string[]
  feature: Record<string, unknown>
  featureAlias: string
  featureDirectoryUrl: URL
  featureSourceFiles: string[]
}

const DELETED_NESTED_ENTRYPOINTS = [
  "form-workflow/index.ts",
  "sheet-workflow/index.ts",
  "table-workflow/index.ts",
]

function readFeatureSource(featureDirectoryUrl: URL, filePath: string) {
  return readFileSync(new URL(filePath, featureDirectoryUrl), "utf8")
}

export function assertFeaturePublicApi({
  exportedNames,
  feature,
  featureAlias,
  featureDirectoryUrl,
  featureSourceFiles,
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
      DELETED_NESTED_ENTRYPOINTS.filter((filePath) =>
        existsSync(new URL(filePath, featureDirectoryUrl))
      )
    ).toStrictEqual([])
  })
}
