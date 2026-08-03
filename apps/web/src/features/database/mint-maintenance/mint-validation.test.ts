import { describe, expect, it } from "vitest"

import { createMintInputSchema } from "./mint-validation"

describe("Mint form validation", () => {
  it("preserves the Collector-facing Mint validation messages", () => {
    const result = createMintInputSchema.safeParse({
      code: "Madrid Mint",
      name: "A".repeat(256),
    })

    expect(result.success).toBe(false)
    if (result.success) throw new Error("Expected Mint validation to fail")
    expect(result.error.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ["code"],
          message:
            "Mint Code must use lowercase letters, numbers, and hyphens only.",
        }),
        expect.objectContaining({
          path: ["name"],
          message: "Mint Name must be 255 characters or fewer.",
        }),
      ])
    )
  })

  it("keeps blank-field feedback specific to Mint fields", () => {
    const result = createMintInputSchema.safeParse({ code: " ", name: " " })

    expect(result.success).toBe(false)
    if (result.success) throw new Error("Expected Mint validation to fail")
    expect(result.error.issues.map((issue) => issue.message)).toEqual(
      expect.arrayContaining([
        "Mint Code cannot be blank.",
        "Mint Name cannot be blank.",
      ])
    )
  })
})
