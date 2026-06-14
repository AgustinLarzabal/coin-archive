import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

const readme = readFileSync(resolve(import.meta.dirname, "../README.md"), "utf8")

describe("packages/db README", () => {
  it("documents Coin Surface storage and keeps Edge, Rim, and Engraver boundaries aligned with the glossary", () => {
    expect(readme).toContain("`coin_surface`")
    expect(readme).toContain("Obverse, Reverse, and Edge Surface")
    expect(readme).toContain("Edge remains a coin-level controlled classification")
    expect(readme).toContain("Rim remains coin-level")
    expect(readme).toContain("Engraver Attribution remains face-specific")
    expect(readme).not.toContain("Coin Face, not directly to the whole Coin")
  })
})
