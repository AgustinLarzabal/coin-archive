import { describe, expect, expectTypeOf, it } from "vitest"
import type { SeededCoin } from "./seed-data"
import { seededIssuers } from "./seed-data"

describe("SeededCoin", () => {
  it("accepts nullable comments in seed input", () => {
    expectTypeOf<SeededCoin["comments"]>().toEqualTypeOf<
      string | null | undefined
    >()
  })
})

describe("seededIssuers", () => {
  it("defines required ISO Codes for the demo issuers", () => {
    expect(seededIssuers).toMatchObject([
      { code: "argentina", isoCode: "AR" },
      { code: "buenos-aires", isoCode: "AR" },
      { code: "united-states", isoCode: "US" },
      { code: "spain", isoCode: "ES" },
    ])
  })
})
