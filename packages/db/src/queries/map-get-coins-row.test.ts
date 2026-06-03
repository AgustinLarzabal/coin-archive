import { describe, expect, it } from "vitest"
import {
  mapGetCoinsRowToCoinRecord,
  type GetCoinsRow,
} from "./map-get-coins-row"

describe("mapGetCoinsRowToCoinRecord", () => {
  const createdAt = new Date("2026-06-01T12:00:00.000Z")
  const updatedAt = new Date("2026-06-02T12:00:00.000Z")

  it("maps a query row into the exact coin record shape", () => {
    const row: GetCoinsRow = {
      id: "coin-1",
      title: "Silver Test Crown",
      createdAt,
      updatedAt,
      issuerCode: "roman-empire",
      issuerName: "Roman Empire",
      parentIssuerCode: "ancient-world",
      parentIssuerName: "Ancient World",
    }

    expect(mapGetCoinsRowToCoinRecord(row)).toStrictEqual({
      id: "coin-1",
      title: "Silver Test Crown",
      createdAt,
      updatedAt,
      issuer: {
        code: "roman-empire",
        name: "Roman Empire",
        parent: {
          code: "ancient-world",
          name: "Ancient World",
        },
      },
    })
  })

  it("sets issuer parent to null when the query row has no parent issuer", () => {
    const row: GetCoinsRow = {
      id: "coin-2",
      title: "Bronze Test Coin",
      createdAt,
      updatedAt,
      issuerCode: "athens",
      issuerName: "Athens",
      parentIssuerCode: null,
      parentIssuerName: null,
    }

    expect(mapGetCoinsRowToCoinRecord(row)).toStrictEqual({
      id: "coin-2",
      title: "Bronze Test Coin",
      createdAt,
      updatedAt,
      issuer: {
        code: "athens",
        name: "Athens",
        parent: null,
      },
    })
  })
})
