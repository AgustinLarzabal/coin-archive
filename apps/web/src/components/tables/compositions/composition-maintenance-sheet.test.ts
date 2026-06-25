import { describe, expect, it } from "vitest"

import { COMPOSITION_DELETE_REASSIGN_REQUIRED_MESSAGE } from "@/lib/composition-maintenance"

import {
  COMPOSITION_DELETE_CONFIRMATION_DESCRIPTION,
} from "./composition-maintenance-sheet"

describe("COMPOSITION_DELETE_CONFIRMATION_DESCRIPTION", () => {
  it("explains the deletion is permanent and reuses the shared reassignment rule", () => {
    expect(COMPOSITION_DELETE_CONFIRMATION_DESCRIPTION).toContain(
      "permanently deletes the Composition"
    )
    expect(COMPOSITION_DELETE_CONFIRMATION_DESCRIPTION).toContain("existing Coins")
    expect(COMPOSITION_DELETE_CONFIRMATION_DESCRIPTION).toContain(
      COMPOSITION_DELETE_REASSIGN_REQUIRED_MESSAGE.replace(
        "those Coins",
        "existing Coins"
      )
    )
  })
})
