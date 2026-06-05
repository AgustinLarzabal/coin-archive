import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const readmePath = resolve(packageRoot, "README.md")
const requiredReadmeSnippets = [
  "maintainers and coding agents",
  "Coin has exactly one direct Issuer",
  "Coin may have zero or more Ruler attributions",
  "Ruler Attribution Order",
  "Coin may have zero or more Catalogue References",
  "Issuer Grouping",
  "Ruler Group",
  "coin",
  "issuer",
  "coin_ruler",
  "coin_reference",
  "ruler_group",
  "```mermaid",
  "Current database-enforced invariants",
  "Known gaps and future schema work",
  "arbitrary Issuer Grouping cycles are not yet prevented",
  "Coin Titles are display labels and should not be parsed into structured catalogue data",
  "consume shared database behavior from the database package",
  "DATABASE_URL",
  "DATABASE_TEST_URL",
  "npm run db:start",
  "npm run db:migrate",
  "npm run db:seed",
  "npm run db:test",
] as const

function readReadme() {
  return readFileSync(readmePath, "utf8")
}

describe("database package README", () => {
  it("documents the current database architecture and workflow for maintainers", () => {
    const readme = readReadme()

    for (const snippet of requiredReadmeSnippets) {
      expect(readme).toContain(snippet)
    }
  })
})
