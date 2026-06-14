import { describe, expect, it } from "vitest"
import { jsonInspectorMetadata } from "./json-inspector-metadata"

describe("jsonInspectorMetadata", () => {
  it("describes Coin Surface storage and face-only Engraver Attribution for the coins query", () => {
    const coinsMetadata = jsonInspectorMetadata.coins

    expect(coinsMetadata.databaseTables).toContain("coin_surface")
    expect(coinsMetadata.databaseTables).not.toContain("coin_face")

    expect(coinsMetadata.requirements).toContain(
      "Optional relations such as orientation, edge, shape, rim, technique, mints, themes, rulers, Coin Surface details, face-only Engraver Attribution rows, and catalogue references must point to existing rows."
    )
    expect(coinsMetadata.limitations).toContain(
      "Coin Surface rows are limited to one obverse, one reverse, and one edge-surface per coin."
    )
    expect(coinsMetadata.limitations).toContain(
      "Engraver Attribution remains face-specific, so only obverse and reverse Coin Surface rows may carry engraver links."
    )
  })

  it("describes engraver delete restrictions through face-only Engraver Attribution rows", () => {
    expect(jsonInspectorMetadata.engravers.limitations).toContain(
      "An engraver cannot be deleted while face-only Engraver Attribution rows still reference it."
    )
  })
})
