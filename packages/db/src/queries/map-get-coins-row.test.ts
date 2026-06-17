import { describe, expect, it } from "vitest"
import { mapGetCoinsRowsToCoinRecords } from "./map-get-coins-row"

describe("mapGetCoinsRowsToCoinRecords", () => {
  it("maps list rows to minimal coin records", () => {
    expect(
      mapGetCoinsRowsToCoinRecords([
        {
          id: "coin-1",
          title: "Spanish Test Coin",
          issuerId: "issuer-1",
          issuerCode: "spain",
          issuerIsoCode: "ES",
          issuerName: "Spain",
        },
      ])
    ).toStrictEqual([
      {
        id: "coin-1",
        title: "Spanish Test Coin",
        issuer: {
          id: "issuer-1",
          code: "spain",
          isoCode: "ES",
          name: "Spain",
        },
      },
    ])
  })
})
