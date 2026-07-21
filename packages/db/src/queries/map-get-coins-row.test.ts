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
            imageUrl: "https://example.com/edge-image",
          },
        },
      },
    ])
  })
})
