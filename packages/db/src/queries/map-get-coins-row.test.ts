import { describe, expect, it } from "vitest"
import {
  mapGetCoinsRowToCoinRecord,
  type GetCoinsRow,
} from "./map-get-coins-row"

describe("mapGetCoinsRowToCoinRecord", () => {
  it("maps a query row into the exact catalogue record shape", () => {
    const row: GetCoinsRow = {
      id: "coin-1",
      title: "Silver Test Crown",
      createdAt: new Date("2026-06-01T12:00:00.000Z"),
      updatedAt: new Date("2026-06-02T12:00:00.000Z"),
      issuerCode: "roman-empire",
      issuerName: "Roman Empire",
      parentIssuerCode: "ancient-world",
      parentIssuerName: "Ancient World",
    }

    expect(mapGetCoinsRowToCoinRecord(row)).toStrictEqual({
      id: "coin-1",
      title: "Silver Test Crown",
      createdAt: new Date("2026-06-01T12:00:00.000Z"),
      updatedAt: new Date("2026-06-02T12:00:00.000Z"),
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
})
