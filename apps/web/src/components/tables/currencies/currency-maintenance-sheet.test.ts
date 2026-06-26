import { describe, expect, it } from "vitest"

import { CURRENCY_DELETE_REASSIGN_REQUIRED_MESSAGE } from "@/lib/currency-maintenance"

import { CURRENCY_DELETE_CONFIRMATION_DESCRIPTION } from "./currency-maintenance-sheet"

describe("CURRENCY_DELETE_CONFIRMATION_DESCRIPTION", () => {
  it("explains the deletion is permanent and reuses the shared reassignment rule", () => {
    expect(CURRENCY_DELETE_CONFIRMATION_DESCRIPTION).toContain(
      "permanently deletes the Currency"
    )
    expect(CURRENCY_DELETE_CONFIRMATION_DESCRIPTION).toContain("existing Coins")
    expect(CURRENCY_DELETE_CONFIRMATION_DESCRIPTION).toContain(
      CURRENCY_DELETE_REASSIGN_REQUIRED_MESSAGE.replace(
        "those Coins",
        "existing Coins"
      )
    )
  })
})
