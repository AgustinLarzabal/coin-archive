import type { CompositionOption } from "@workspace/db"
import { describe, expect, it } from "vitest"

import {
  canDeleteCompositionFromSheet,
  COMPOSITION_DELETE_CONFIRMATION_DESCRIPTION,
} from "./composition-maintenance-sheet"

const composition: CompositionOption = {
  id: "0933c940-842f-42a6-bd41-e3a0d3d27e39",
  code: "silver-900",
  name: "Silver (.900)",
  description: "Ninety percent silver alloy.",
  createdAt: new Date("2026-06-24T12:00:00.000Z"),
  updatedAt: new Date("2026-06-24T12:00:00.000Z"),
}

describe("canDeleteCompositionFromSheet", () => {
  it("only allows delete actions for existing Compositions", () => {
    expect(canDeleteCompositionFromSheet(null)).toBe(false)
    expect(canDeleteCompositionFromSheet(composition)).toBe(true)
  })
})

describe("COMPOSITION_DELETE_CONFIRMATION_DESCRIPTION", () => {
  it("explains the deletion is permanent and that Coins must be reassigned first", () => {
    expect(COMPOSITION_DELETE_CONFIRMATION_DESCRIPTION).toContain(
      "permanently deletes the Composition"
    )
    expect(COMPOSITION_DELETE_CONFIRMATION_DESCRIPTION).toContain(
      "Every Coin has exactly one Composition"
    )
    expect(COMPOSITION_DELETE_CONFIRMATION_DESCRIPTION).toContain(
      "reassigned to another Composition before this Composition can be deleted"
    )
  })
})
