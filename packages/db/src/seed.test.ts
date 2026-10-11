import { describe, expect, it } from "vitest"

import { parseCoinSeedDocument } from "./index.js"

const FIRST_ENGRAVER_SLUG = "first-engraver"

function validSeed() {
  return {
    issuers: [{ name: "Argentina", code: "AR" }],
    engravers: [{ slug: FIRST_ENGRAVER_SLUG, fullName: "First Engraver" }],
    coins: [
      {
        id: "00000000-0000-4000-8000-000000000001",
        title: "First coin",
        issuerCode: "AR",
        obverse: { engraverSlugs: [FIRST_ENGRAVER_SLUG] },
      },
    ],
  }
}

describe("Coin seed catalogue", () => {
  it("accepts editor-supplied Engraver Slugs and Slug-based credits", () => {
    const seed = validSeed()

    expect(parseCoinSeedDocument(seed)).toEqual(seed)
  })

  it.each([
    "ab",
    "a".repeat(65),
    "First-engraver",
    "first_engraver",
    "-first-engraver",
    "first-engraver-",
    "first--engraver",
  ])("rejects the invalid Engraver Slug %j", (slug) => {
    const seed = validSeed()
    seed.engravers[0].slug = slug

    expect(() => parseCoinSeedDocument(seed)).toThrow()
  })

  it("allows duplicate Engraver full names", () => {
    const seed = validSeed()
    seed.engravers.push({
      slug: "second-engraver",
      fullName: seed.engravers[0].fullName,
    })

    expect(parseCoinSeedDocument(seed)).toEqual(seed)
  })

  it("rejects duplicate Engraver Slugs", () => {
    const seed = validSeed()
    seed.engravers.push({
      slug: FIRST_ENGRAVER_SLUG,
      fullName: "Second Engraver",
    })

    expect(() => parseCoinSeedDocument(seed)).toThrow(
      `Duplicate Engraver Slug: ${FIRST_ENGRAVER_SLUG}`
    )
  })
})
