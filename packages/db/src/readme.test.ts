import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const readmePath = resolve(packageRoot, "README.md")

function readReadme() {
  return readFileSync(readmePath, "utf8")
}

describe("database package README", () => {
  it("documents the current database architecture and workflow for maintainers", () => {
    const readme = readReadme()

    expect(readme).toContain("maintainers and coding agents")
    expect(readme).toContain("Coin has exactly one direct Issuer")
    expect(readme).toContain("Coin may have zero or more Ruler attributions")
    expect(readme).toContain("Ruler Attribution Order")
    expect(readme).toContain("Coin may have zero or more Catalogue References")
    expect(readme).toContain("Issuer Grouping")
    expect(readme).toContain("Ruler Group")
    expect(readme).toContain("coin")
    expect(readme).toContain("issuer")
    expect(readme).toContain("coin_ruler")
    expect(readme).toContain("coin_reference")
    expect(readme).toContain("ruler_group")
    expect(readme).toContain("```mermaid")
    expect(readme).toContain("Current database-enforced invariants")
    expect(readme).toContain("Known gaps and future schema work")
    expect(readme).toContain("arbitrary Issuer Grouping cycles are not yet prevented")
    expect(readme).toContain(
      "Coin Titles are display labels and should not be parsed into structured catalogue data"
    )
    expect(readme).toContain(
      "consume shared database behavior from the database package"
    )
    expect(readme).toContain("DATABASE_URL")
    expect(readme).toContain("DATABASE_TEST_URL")
    expect(readme).toContain("npm run db:start")
    expect(readme).toContain("npm run db:migrate")
    expect(readme).toContain("npm run db:seed")
    expect(readme).toContain("npm run db:test")
  })
})
