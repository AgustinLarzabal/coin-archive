import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const rootReadmePath = resolve(packageRoot, "..", "..", "README.md")

const requiredRootReadmeSnippets = [
  "Coin Archive is a catalog of physical coins from across history.",
  "## Workspace layout",
  "`apps/web`",
  "`packages/db`",
  "`packages/ui`",
  "`docs/adr`",
  "## Quick start",
  "`pnpm install`",
  "`npm run db:start`",
  "`npm run db:migrate`",
  "`npm run db:seed`",
  "`npm run dev`",
  "`npm run test`",
  "`npm run typecheck`",
  "[Catalogue glossary]",
  "[Database architecture]",
  "[Testing strategy]",
  "[Architectural decision records]",
] as const

function readRootReadme() {
  return readFileSync(rootReadmePath, "utf8")
}

describe("root README", () => {
  it("orients maintainers to the repo and deeper documentation", () => {
    const readme = readRootReadme()

    for (const snippet of requiredRootReadmeSnippets) {
      expect(readme).toContain(snippet)
    }
  })
})
