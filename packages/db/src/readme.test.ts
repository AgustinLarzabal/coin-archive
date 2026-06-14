import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

const readmePath = resolve(import.meta.dirname, "../README.md")
const readme = readFileSync(readmePath, "utf8")

const requiredReadmeSnippets = [
  "`coin_surface`",
  "Obverse, Reverse, and Edge Surface",
  "Edge remains a coin-level controlled classification",
  "Rim remains coin-level",
  "Engraver Attribution remains face-specific",
] as const

const removedReadmeSnippets = [
  "Coin Face, not directly to the whole Coin",
] as const

describe("packages/db README", () => {
  it("documents Coin Surface storage and keeps Edge, Rim, and Engraver boundaries aligned with the glossary", () => {
    for (const snippet of requiredReadmeSnippets) {
      expect(readme).toContain(snippet)
    }

    for (const snippet of removedReadmeSnippets) {
      expect(readme).not.toContain(snippet)
    }
  })
})
