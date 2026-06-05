import { existsSync, readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

const packageSourceDir = dirname(fileURLToPath(import.meta.url))
const workspaceRoot = resolve(packageSourceDir, "../../..")
const rootReadmePath = resolve(workspaceRoot, "README.md")
const rootPackageJsonPath = resolve(workspaceRoot, "package.json")

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

const requiredRootDocumentationPaths = [
  "CONTEXT.md",
  "packages/db/README.md",
  "docs/testing.md",
  "docs/adr",
] as const

type RootPackageJson = {
  scripts?: Record<string, string>
}

function readRootReadme() {
  return readFileSync(rootReadmePath, "utf8")
}

function readRootPackageJson() {
  return JSON.parse(readFileSync(rootPackageJsonPath, "utf8")) as RootPackageJson
}

describe("root README", () => {
  it("orients maintainers to the repo and deeper documentation", () => {
    const readme = readRootReadme()

    for (const snippet of requiredRootReadmeSnippets) {
      expect(readme).toContain(snippet)
    }
  })

  it("points to real documentation and current root scripts", () => {
    const { scripts = {} } = readRootPackageJson()

    for (const scriptName of requiredRootScripts) {
      expect(scripts[scriptName]).toBeTruthy()
    }

    for (const documentationPath of requiredRootDocumentationPaths) {
      expect(
        existsSync(resolve(workspaceRoot, documentationPath)),
        `${documentationPath} should exist`,
      ).toBe(true)
    }
  })
})
