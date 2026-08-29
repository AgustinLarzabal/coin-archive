import { existsSync, readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

import { assertFeaturePublicApi } from "../public-api-contract"
import { readFeatureSource } from "../public-api-test-helpers"
import * as feature from "./index"

const FEATURE_DIRECTORY_URL = new URL(".", import.meta.url)
const FEATURE_ALIAS = "@/features/database/coin-maintenance"

function collectFeatureRuntimeImports(
  fileUrl: URL,
  seen = new Set<string>()
): string[] {
  if (seen.has(fileUrl.href)) return []
  seen.add(fileUrl.href)

  const source = readFileSync(fileUrl, "utf8")
  const imports = [...source.matchAll(/(?:import|export)\s+(?:[^"']*?from\s+)?["'](\.\.?\/[^"']+)["']/g)].flatMap(
    (match) =>
      match[0].startsWith("import type")
        ? []
        : [new URL(match[1], fileUrl)]
  )

  return [
    source,
    ...imports.flatMap((target) => {
      const moduleUrl = resolveModuleUrl(target)
      return moduleUrl.pathname.endsWith(".server.ts")
        ? []
        : collectFeatureRuntimeImports(moduleUrl, seen)
    }),
  ]
}

function resolveModuleUrl(url: URL) {
  for (const extension of [".ts", ".tsx"]) {
    const candidate = new URL(`${url.pathname}${extension}`, url)
    if (existsSync(candidate)) return candidate
  }

  throw new Error(`Unable to resolve runtime import ${url.pathname}`)
}

describe("coin-maintenance public API", () => {
  assertFeaturePublicApi({
    exportedNames: [
      "CoinCreateRouteComponent",
      "CoinEditRouteComponent",
      "CoinMaintenanceRouteComponent",
      "coinMaintenanceSearchSchema",
      "getCoinEditLoaderDeps",
      "getCoinMaintenanceLoaderDeps",
      "loadCoinCreateRouteData",
      "loadCoinEditRouteData",
      "loadCoinMaintenanceRouteData",
    ],
    feature,
    featureAlias: FEATURE_ALIAS,
    featureDirectoryUrl: FEATURE_DIRECTORY_URL,
  })

  it("keeps migrated Coin deletion outside the database package boundary", () => {
    const actions = readFeatureSource(
      FEATURE_DIRECTORY_URL,
      "actions.server.ts"
    )

    expect(actions).toContain("client.coins.delete")
    expect(actions).not.toContain('@coin-archive/db"')
    expect(actions).not.toContain("deletePublishedImage")
  })

  it("does not reach a server-only maintenance API module from its client entry point", () => {
    const runtimeSources = collectFeatureRuntimeImports(
      new URL("index.ts", FEATURE_DIRECTORY_URL)
    )

    expect(runtimeSources.join("\n")).not.toContain("maintenance-api.server")
  })
})
