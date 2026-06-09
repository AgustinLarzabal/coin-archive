import { describe, expectTypeOf, it } from "vitest"
import { seededCoins } from "./seed-data"

describe("seededCoins", () => {
  it("accepts nullable comments in the seed-shaped Coin input", () => {
    expectTypeOf<(typeof seededCoins)[number]["comments"]>().toEqualTypeOf<
      string | null | undefined
    >()
  })
})
