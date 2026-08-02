import { describe, expect, it } from "vitest"

import { DISTRIBUTION_DELETE_REASSIGN_REQUIRED_MESSAGE } from "../messages"

import { DISTRIBUTION_DELETE_CONFIRMATION_DESCRIPTION } from "./distribution-maintenance-sheet"

describe("DISTRIBUTION_DELETE_CONFIRMATION_DESCRIPTION", () => {
  it("explains the deletion is permanent and reuses the shared reassignment rule", () => {
    expect(DISTRIBUTION_DELETE_CONFIRMATION_DESCRIPTION).toContain(
      "permanently deletes the Distribution"
    )
    expect(DISTRIBUTION_DELETE_CONFIRMATION_DESCRIPTION).toContain(
      "existing Coins"
    )
    expect(DISTRIBUTION_DELETE_CONFIRMATION_DESCRIPTION).toContain(
      DISTRIBUTION_DELETE_REASSIGN_REQUIRED_MESSAGE.replace(
        "those Coins",
        "existing Coins"
      )
    )
  })
})
