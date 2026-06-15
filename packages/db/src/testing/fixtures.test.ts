import { describe, expect, expectTypeOf, it } from "vitest"

type FixturesModule = typeof import("./fixtures")
type CreateCoinInput = Parameters<FixturesModule["createCoin"]>[0]
type CreateCoinSurfaceInput = Parameters<FixturesModule["createCoinSurface"]>[0]
type IndexModule = typeof import("../index")

describe("testing fixtures", () => {
  it("accepts surface-oriented coin detail input and keeps engraver helpers surface-oriented", () => {
    expectTypeOf<CreateCoinInput>().toMatchTypeOf<{
      surfaces?: Array<Omit<CreateCoinSurfaceInput, "coinId">>
    }>()
    expectTypeOf<CreateCoinSurfaceInput["thumbnailUrl"]>().toEqualTypeOf<
      string | null | undefined
    >()
    expectTypeOf<CreateCoinSurfaceInput["imageUrl"]>().toEqualTypeOf<
      string | null | undefined
    >()

    expectTypeOf<FixturesModule["createCoinSurface"]>().toBeFunction()
    expectTypeOf<FixturesModule["createCoinSurfaceEngraver"]>().toBeFunction()
    expectTypeOf<"createCoinFace" extends keyof FixturesModule ? true : false>()
      .toEqualTypeOf<false>()
  })
})

describe("database package exports", () => {
  it("exports coin surface kinds under the surface terminology", () => {
    expectTypeOf<IndexModule["coinSurfaceKinds"]>().toEqualTypeOf<
      readonly ["obverse", "reverse", "edge-surface"]
    >()
  })
})
