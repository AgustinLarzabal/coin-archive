import { describe, expect, it } from "vitest"
import { jsonInspectorMetadata } from "./json-inspector-metadata"

const coinsRequirements = [
  "Coin Surface rows may include optional absolute http:// or https:// Surface Thumbnail and Surface Image URLs.",
  "Optional relations such as orientation, edge, shape, rim, technique, mints, themes, rulers, Coin Surface details, face-only Engraver Attribution rows, and catalogue references must point to existing rows.",
] as const

const coinsLimitations = [
  "Coin Surface rows are limited to one obverse, one reverse, and one edge-surface per coin.",
  "Coin Surface image URLs must be absolute http:// or https:// web URLs when present.",
  "Engraver Attribution remains face-specific, so only obverse and reverse Coin Surface rows may carry engraver links.",
] as const

const engraverLimitations = [
  "An engraver cannot be deleted while face-only Engraver Attribution rows still reference it.",
] as const

describe("jsonInspectorMetadata", () => {
  it("describes Coin Surface storage and face-only Engraver Attribution for the coins query", () => {
    const coinsMetadata = jsonInspectorMetadata.coins

    expect(coinsMetadata.databaseTables).toContain("coin_surface")
    expect(coinsMetadata.databaseTables).not.toContain("coin_face")

    for (const requirement of coinsRequirements) {
      expect(coinsMetadata.requirements).toContain(requirement)
    }

    for (const limitation of coinsLimitations) {
      expect(coinsMetadata.limitations).toContain(limitation)
    }
  })

  it("describes engraver delete restrictions through face-only Engraver Attribution rows", () => {
    for (const limitation of engraverLimitations) {
      expect(jsonInspectorMetadata.engravers.limitations).toContain(limitation)
    }
  })
})
