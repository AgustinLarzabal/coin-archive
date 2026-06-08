import { describe, expect, it } from "vitest"

import { formatFaceValueLabel } from "./coin-summary"

describe("formatFaceValueLabel", () => {
  it("uses the Face Value domain label with the stored face value text", () => {
    expect(formatFaceValueLabel({ text: "2 Euros" })).toBe(
      "Face Value: 2 Euros"
    )
  })
})
