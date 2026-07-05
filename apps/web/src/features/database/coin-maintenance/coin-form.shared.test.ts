import { describe, expect, it } from "vitest"

import { getNextEditSuccessMessage } from "./coin-form.shared"

describe("getNextEditSuccessMessage", () => {
  it("preserves the current success message when the edit form refreshes the same Coin", () => {
    expect(
      getNextEditSuccessMessage({
        currentSuccessMessage: "Saved.",
        nextCoinId: "coin-1",
        previousCoinId: "coin-1",
      })
    ).toBe("Saved.")
  })

  it("clears the success message when the edit form loads a different Coin", () => {
    expect(
      getNextEditSuccessMessage({
        currentSuccessMessage: "Saved.",
        nextCoinId: "coin-2",
        previousCoinId: "coin-1",
      })
    ).toBeNull()
  })
})
