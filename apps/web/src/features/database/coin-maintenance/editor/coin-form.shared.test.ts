import { describe, expect, it } from "vitest"
import type { CoinMaintenanceRecord } from "@coin-archive/db"

import {
  areCoinDraftsEqual,
  createCoinDraft,
  getNextEditSuccessMessage,
  hasRequiredCoinDraftFields,
} from "./coin-form.shared"

const coin: CoinMaintenanceRecord & { etag: string } = {
  id: "coin-1",
  title: "Spanish Test Coin",
  comments: "Public note",
  compositionDescription: "Outer ring: nickel-brass; core: copper-nickel.",
  compositionId: "composition-1",
  currencyId: "currency-1",
  diameter: 24,
  distributionId: "distribution-1",
  edgeId: null,
  faceValueNumericValue: 1,
  faceValueText: "1 Euro",
  isDemonetized: null,
  issuerId: "issuer-1",
  maxYear: 2001,
  minYear: 1999,
  mintIds: ["mint-1", "mint-2"],
  mintage: 1000,
  orientationId: null,
  rimId: null,
  rulerIds: ["ruler-1", "ruler-2"],
  shapeId: null,
  techniqueId: null,
  themeIds: ["theme-1"],
  thickness: 1.9,
  weight: 7.5,
  references: [
    {
      catalogueId: "catalogue-1",
      number: "KM 12",
    },
  ],
  surfaces: {
    obverse: {
      description: "Bust",
      lettering: "OBV",
      imageUrl: "https://example.com/obverse.jpg",
      engraverIds: ["engraver-1"],
    },
    reverse: null,
    edge: {
      description: "Reeded",
      lettering: null,
      imageUrl: "https://example.com/edge.jpg",
    },
  },
  version: 1,
  etag: '"coin-version-1"',
  createdAt: new Date("2026-07-05T00:00:00.000Z"),
  updatedAt: new Date("2026-07-05T00:00:00.000Z"),
}

describe("createCoinDraft", () => {
  it("maps persisted aggregate record data into the editable draft shape", () => {
    expect(createCoinDraft(coin)).toMatchObject({
      compositionDescription: "Outer ring: nickel-brass; core: copper-nickel.",
      rulers: [{ rulerId: "ruler-1" }, { rulerId: "ruler-2" }],
      mints: [{ mintId: "mint-1" }, { mintId: "mint-2" }],
      themes: [{ themeId: "theme-1" }],
      references: [{ catalogueId: "catalogue-1", number: "KM 12" }],
      surfaces: {
        obverse: {
          description: "Bust",
          lettering: "OBV",
          imageUrl: "https://example.com/obverse.jpg",
          engraverIds: ["engraver-1"],
        },
        reverse: {
          description: "",
          lettering: "",
          imageUrl: "",
          engraverIds: [],
        },
        edge: {
          description: "Reeded",
          lettering: "",
          imageUrl: "https://example.com/edge.jpg",
        },
      },
    })
  })
})

describe("hasRequiredCoinDraftFields", () => {
  it("requires the core scalar fields and at least one Ruler Attribution", () => {
    expect(
      hasRequiredCoinDraftFields({
        ...createCoinDraft(coin),
        rulers: [],
      })
    ).toBe(false)
  })
})

describe("getNextEditSuccessMessage", () => {
  it("preserves the current success message when the edit form refreshes the same Coin", () => {
    expect(
      getNextEditSuccessMessage({
        currentSuccessMessage: "Saved.",
        nextCoinId: "coin-1",
        previousCoinId: "coin-1",
      })
    ).toBe("Saved.")
  })

  it("clears the success message when the edit form loads a different Coin", () => {
    expect(
      getNextEditSuccessMessage({
        currentSuccessMessage: "Saved.",
        nextCoinId: "coin-2",
        previousCoinId: "coin-1",
      })
    ).toBeNull()
  })
})

describe("areCoinDraftsEqual", () => {
  it("returns true for identical aggregate drafts", () => {
    const draft = createCoinDraft(coin)

    expect(areCoinDraftsEqual(draft, createCoinDraft(coin))).toBe(true)
  })

  it("returns false when a nested child collection row changes", () => {
    const draft = createCoinDraft(coin)

    expect(
      areCoinDraftsEqual(draft, {
        ...draft,
        references: [
          {
            ...draft.references[0],
            number: "KM 99",
          },
        ],
      })
    ).toBe(false)
  })

  it("returns false when Composition Description changes", () => {
    const draft = createCoinDraft(coin)

    expect(
      areCoinDraftsEqual(draft, {
        ...draft,
        compositionDescription: "",
      })
    ).toBe(false)
  })

  it("returns false when child collection order changes", () => {
    const draft = createCoinDraft(coin)

    expect(
      areCoinDraftsEqual(draft, {
        ...draft,
        rulers: [...draft.rulers].reverse(),
      })
    ).toBe(false)
  })
})
