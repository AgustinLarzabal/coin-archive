import { describe, expectTypeOf, it } from "vitest"
import type { SeededCoin } from "./seed-data"

describe("SeededCoin", () => {
  it("accepts nullable comments in seed input", () => {
    expectTypeOf<SeededCoin["comments"]>().toEqualTypeOf<
      string | null | undefined
    >()
  })
})
