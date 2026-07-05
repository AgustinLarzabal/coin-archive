import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const ROUTE_DIRECTORY_URL = new URL(".", import.meta.url)
const FEATURE_OWNED_ROUTE_FILES = [
  "catalogues.tsx",
  "currencies.tsx",
  "distributions.tsx",
  "edges.tsx",
  "engravers.tsx",
  "index.tsx",
  "issuers.tsx",
  "minting-techniques.tsx",
  "mints.tsx",
  "orientations.tsx",
  "rims.tsx",
  "ruler-groups.tsx",
  "rulers.tsx",
  "shapes.tsx",
  "themes.tsx",
]

function readRouteSource(filePath: string) {
  return readFileSync(new URL(filePath, ROUTE_DIRECTORY_URL), "utf8")
}

describe("database route adapters", () => {
  it("stay thin and avoid route-owned page render helpers", () => {
    for (const filePath of FEATURE_OWNED_ROUTE_FILES) {
      expect(readRouteSource(filePath)).not.toMatch(
        /export function renderDatabase/
      )
    }
  })
})
