import { describe, expect, expectTypeOf, it } from "vitest"

type FixturesModule = typeof import("./fixtures")
type CreateCoinInput = Parameters<FixturesModule["createCoin"]>[0]
type IndexModule = typeof import("../index")

describe("testing fixtures", () => {
  it("accepts surface-oriented coin detail input and keeps engraver helpers face-specific", () => {
    expectTypeOf<CreateCoinInput>().toMatchTypeOf<{
      surfaces?: Array<{
        kind: "obverse" | "reverse" | "edge-surface"
        description?: string | null
        lettering?: string | null
      }>
    }>()

    expectTypeOf<FixturesModule["createCoinSurface"]>().toBeFunction()
    expectTypeOf<FixturesModule["createCoinFaceEngraver"]>().toBeFunction()
    expectTypeOf<
      "createCoinFace" extends keyof FixturesModule ? true : false
    >().toEqualTypeOf<false>()
  })
})

describe("database package exports", () => {
  it("exports coin surface kinds under the surface terminology", () => {
    expectTypeOf<IndexModule["coinSurfaceKinds"]>().toEqualTypeOf<
      readonly ["obverse", "reverse", "edge-surface"]
    >()
  })
})
