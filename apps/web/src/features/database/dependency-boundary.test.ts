import { existsSync, readFileSync, readdirSync } from "node:fs"
import { extname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

const DATABASE_FEATURE_DIRECTORY = fileURLToPath(new URL(".", import.meta.url))
const WEB_SOURCE_DIRECTORY = join(DATABASE_FEATURE_DIRECTORY, "../..")
const IDENTITY_WORKFLOW = join(
  WEB_SOURCE_DIRECTORY,
  "lib/collector-deletion.ts"
)
const ALLOWED_DATABASE_IMPORTS = new Set([
  // Collector deletion is an explicitly out-of-scope identity workflow.
  IDENTITY_WORKFLOW,
  // These existing catalogue reads are public, not Database Maintenance.
  join(WEB_SOURCE_DIRECTORY, "routes/_app/(public)/index.tsx"),
  join(WEB_SOURCE_DIRECTORY, "components/coin-card.tsx"),
  join(WEB_SOURCE_DIRECTORY, "components/home-filters/home-filters.tsx"),
  join(
    WEB_SOURCE_DIRECTORY,
    "components/home-filters/home-filters.helpers.tsx"
  ),
])
const OBSOLETE_SURFACE_IMAGE_STORAGE = join(
  DATABASE_FEATURE_DIRECTORY,
  "coin-maintenance/surface-images/surface-image-storage.ts"
)

function productionTypeScriptFiles(directory: string): string[] {
  if (!existsSync(directory)) return []
  if ([".ts", ".tsx"].includes(extname(directory))) return [directory]

  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)

    if (entry.isDirectory()) return productionTypeScriptFiles(path)
    if (![".ts", ".tsx"].includes(extname(entry.name))) return []
    if (entry.name.includes(".test.") || entry.name.includes(".spec."))
      return []

    return [path]
  })
}

describe("Database Maintenance dependency boundary", () => {
  it("keeps web maintenance code outside the database package", () => {
    const violations = productionTypeScriptFiles(WEB_SOURCE_DIRECTORY).filter(
      (path) =>
        !ALLOWED_DATABASE_IMPORTS.has(path) &&
        readFileSync(path, "utf8").includes("@coin-archive/db")
    )

    expect(violations).toStrictEqual([])
    expect(readFileSync(IDENTITY_WORKFLOW, "utf8")).toContain(
      "@coin-archive/db"
    )
  })

  it("keeps Surface Image storage orchestration in the API", () => {
    expect(existsSync(OBSOLETE_SURFACE_IMAGE_STORAGE)).toBe(false)
  })
})
