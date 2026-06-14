import { describe, expect, expectTypeOf, it } from "vitest"
import type { SeededCoin, SeededCoinSurfaceDetails } from "./seed-data"
import { seededCoins, seededIssuers } from "./seed-data"

describe("SeededCoin", () => {
  it("accepts nullable comments in seed input", () => {
    expectTypeOf<SeededCoin["comments"]>().toEqualTypeOf<
      string | null | undefined
    >()
  })

  it("can express obverse, reverse, and edge surface details directly on a seeded coin", () => {
    expectTypeOf<SeededCoin["surfaces"]>().toEqualTypeOf<
      SeededCoinSurfaceDetails[] | undefined
    >()

    expect(
      seededCoins.find(({ title }) => title === "Spain 2 Euro")?.surfaces
    ).toEqual([
      {
        kind: "obverse",
        description: "Portrait of Felipe VI facing left.",
        lettering: "FELIPE VI REY DE ESPANA",
      },
      {
        kind: "reverse",
        description: "Map of Europe with denomination.",
        lettering: "2 EURO",
      },
      {
        kind: "edge-surface",
        description: "Finely reeded with incuse lettering.",
        lettering: "2 **",
      },
    ])
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
