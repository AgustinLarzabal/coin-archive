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

  it("accepts camelCase surface image URL fields in nested coin surface fixture input", () => {
    expectTypeOf<CreateCoinInput>().toMatchTypeOf<{
      surfaces?: Array<{
        thumbnailUrl?: string | null
        imageUrl?: string | null
      }>
    }>()

    const createCoinInput = {
      issuerId: "issuer-id",
      title: "Fixture Surface URLs",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      surfaces: [
        {
          kind: "obverse" as const,
          thumbnailUrl: "https://example.com/coins/fixture/obverse-thumbnail",
          imageUrl: "https://example.com/coins/fixture/obverse-image",
        },
      ],
    } satisfies CreateCoinInput

    expect(createCoinInput.surfaces?.[0]?.thumbnailUrl).toBe(
      "https://example.com/coins/fixture/obverse-thumbnail"
    )
    expect(createCoinInput.surfaces?.[0]?.imageUrl).toBe(
      "https://example.com/coins/fixture/obverse-image"
    )
  })
})

describe("database package exports", () => {
  it("exports coin surface kinds under the surface terminology", () => {
    expectTypeOf<IndexModule["coinSurfaceKinds"]>().toEqualTypeOf<
      readonly ["obverse", "reverse", "edge-surface"]
    >()
  })
})
