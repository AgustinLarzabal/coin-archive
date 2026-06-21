import { describe, expect, expectTypeOf, it } from "vitest"
import type {
  createCoin,
  createCoinSurface,
  createCoinSurfaceEngraver,
} from "./fixtures"
import type { coinSurfaceKinds } from "../index"

type CreateCoinInput = Parameters<typeof createCoin>[0]
type CreateCoinSurfaceInput = Parameters<typeof createCoinSurface>[0]

const fixtureSurfaceUrls = {
  thumbnailUrl: "https://example.com/coins/fixture/obverse-thumbnail",
  imageUrl: "https://example.com/coins/fixture/obverse-image",
} as const

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

    expectTypeOf<typeof createCoinSurface>().toBeFunction()
    expectTypeOf<typeof createCoinSurfaceEngraver>().toBeFunction()
    expectTypeOf<
      "createCoinFace" extends
        | "createCoin"
        | "createCoinSurface"
        | "createCoinSurfaceEngraver"
        ? true
        : false
    >()
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
          ...fixtureSurfaceUrls,
        },
      ],
    } satisfies CreateCoinInput

    expect(createCoinInput.surfaces[0]).toMatchObject(fixtureSurfaceUrls)
  })
})

describe("database package exports", () => {
  it("exports coin surface kinds under the surface terminology", () => {
    expectTypeOf<typeof coinSurfaceKinds>().toEqualTypeOf<
      readonly ["obverse", "reverse", "edge-surface"]
    >()
  })
})
