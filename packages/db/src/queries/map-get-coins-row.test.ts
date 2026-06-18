import { describe, expect, it } from "vitest"
import { mapGetCoinsRowsToCoinRecords } from "./map-get-coins-row"

describe("mapGetCoinsRowsToCoinRecords", () => {
  it("maps list rows to grouped coin records with surfaces", () => {
    expect(
      mapGetCoinsRowsToCoinRecords([
        {
          id: "coin-1",
          title: "Spanish Test Coin",
          issuerId: "issuer-1",
          issuerCode: "spain",
          issuerIsoCode: "ES",
          issuerName: "Spain",
          surfaceKind: "obverse",
          surfaceDescription: "Portrait",
          surfaceLettering: "TEST",
          surfaceThumbnailUrl: "https://example.com/obverse-thumb",
          surfaceImageUrl: "https://example.com/obverse-image",
          engraverId: "engraver-1",
          engraverCode: "ana-ruiz",
          engraverName: "Ana Ruiz",
        },
        {
          id: "coin-1",
          title: "Spanish Test Coin",
          issuerId: "issuer-1",
          issuerCode: "spain",
          issuerIsoCode: "ES",
          issuerName: "Spain",
          surfaceKind: "obverse",
          surfaceDescription: "Portrait",
          surfaceLettering: "TEST",
          surfaceThumbnailUrl: "https://example.com/obverse-thumb",
          surfaceImageUrl: "https://example.com/obverse-image",
          engraverId: "engraver-2",
          engraverCode: "beatriz-lopez",
          engraverName: "Beatriz Lopez",
        },
        {
          id: "coin-1",
          title: "Spanish Test Coin",
          issuerId: "issuer-1",
          issuerCode: "spain",
          issuerIsoCode: "ES",
          issuerName: "Spain",
          surfaceKind: "edge-surface",
          surfaceDescription: "Reeded edge",
          surfaceLettering: null,
          surfaceThumbnailUrl: "https://example.com/edge-thumb",
          surfaceImageUrl: "https://example.com/edge-image",
          engraverId: null,
          engraverCode: null,
          engraverName: null,
        },
      ])
    ).toStrictEqual([
      {
        id: "coin-1",
        title: "Spanish Test Coin",
        issuer: {
          code: "spain",
          isoCode: "ES",
          name: "Spain",
        },
        surfaces: {
          obverse: {
            description: "Portrait",
            lettering: "TEST",
            thumbnailUrl: "https://example.com/obverse-thumb",
            imageUrl: "https://example.com/obverse-image",
            engravers: [
              {
                code: "ana-ruiz",
                name: "Ana Ruiz",
              },
              {
                code: "beatriz-lopez",
                name: "Beatriz Lopez",
              },
            ],
          },
          reverse: null,
          edge: {
            description: "Reeded edge",
            lettering: null,
            thumbnailUrl: "https://example.com/edge-thumb",
            imageUrl: "https://example.com/edge-image",
          },
        },
      },
    ])
  })
})
