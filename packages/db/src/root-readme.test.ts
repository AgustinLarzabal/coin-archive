import { existsSync, readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const rootReadmePath = new URL("../../../README.md", import.meta.url)
const rootPackageJsonPath = new URL("../../../package.json", import.meta.url)

const requiredRootReadmeSnippets = [
  "Coin Archive is a catalog of physical coins from across history.",
  "Use this README as the repository entry point.",
  "## Repository map",
  "## Workspace layout",
  "`apps/web`",
  "`packages/db`",
  "`packages/ui`",
  "`docs/testing.md`",
  "`docs/adr`",
  "`CONTEXT.md`",
  "## Quick start",
  "`pnpm install`",
  "`npm run db:start`",
  "`npm run db:migrate`",
  "`npm run db:seed`",
  "`npm run dev`",
  "`npm run test`",
  "`npm run typecheck`",
  "## Where to go next",
  "[Catalogue glossary]",
  "[Database architecture]",
  "[Testing strategy]",
  "[Architectural decision records]",
] as const

const requiredRootScripts = [
  "dev",
  "typecheck",
  "test",
  "db:start",
  "db:migrate",
  "db:seed",
] as const

const requiredRootReadmeLinks = [
  "../../../CONTEXT.md",
  "../../../packages/db/README.md",
  "../../../docs/testing.md",
  "../../../docs/adr",
] as const

function readRootReadme() {
  return readFileSync(rootReadmePath, "utf8")
}

function readRootPackageJson() {
  return JSON.parse(readFileSync(rootPackageJsonPath, "utf8")) as {
    scripts: Record<string, string>
  }
}

describe("root README", () => {
  it("orients maintainers to the repo and deeper documentation", () => {
    const readme = readRootReadme()

    for (const snippet of requiredRootReadmeSnippets) {
      expect(readme).toContain(snippet)
    }
  })

  it("points to real documentation and current root scripts", () => {
    const packageJson = readRootPackageJson()

    for (const scriptName of requiredRootScripts) {
      expect(packageJson.scripts[scriptName]).toBeTruthy()
    }

    for (const relativePath of requiredRootReadmeLinks) {
      expect(
        existsSync(new URL(relativePath, import.meta.url)),
        `${relativePath} should exist`,
      ).toBe(true)
    }
  })
})
