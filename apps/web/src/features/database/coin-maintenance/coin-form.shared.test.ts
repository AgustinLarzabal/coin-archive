import { describe, expect, it } from "vitest"
import type { CoinMaintenanceRecord } from "@workspace/db"

import {
  areCoinDraftsEqual,
  createCoinDraft,
  getNextEditSuccessMessage,
  hasRequiredCoinDraftFields,
} from "./coin-form.shared"

const coin: CoinMaintenanceRecord = {
  id: "coin-1",
  title: "Spanish Test Coin",
  comments: "Public note",
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
      thumbnailUrl: "https://example.com/obverse-thumb.jpg",
      imageUrl: "https://example.com/obverse.jpg",
      engraverIds: ["engraver-1"],
    },
    reverse: null,
    edge: {
      description: "Reeded",
      lettering: null,
      thumbnailUrl: null,
      imageUrl: "https://example.com/edge.jpg",
    },
  },
}

describe("createCoinDraft", () => {
  it("maps persisted aggregate record data into the editable draft shape", () => {
    expect(createCoinDraft(coin)).toMatchObject({
      rulers: [{ rulerId: "ruler-1" }, { rulerId: "ruler-2" }],
      mints: [{ mintId: "mint-1" }, { mintId: "mint-2" }],
      themes: [{ themeId: "theme-1" }],
      references: [{ catalogueId: "catalogue-1", number: "KM 12" }],
      surfaces: {
        obverse: {
          description: "Bust",
          lettering: "OBV",
          thumbnailUrl: "https://example.com/obverse-thumb.jpg",
          imageUrl: "https://example.com/obverse.jpg",
          engraverIds: ["engraver-1"],
        },
        reverse: {
          description: "",
          lettering: "",
          thumbnailUrl: "",
          imageUrl: "",
          engraverIds: [],
        },
        edge: {
          description: "Reeded",
          lettering: "",
          thumbnailUrl: "",
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
})
