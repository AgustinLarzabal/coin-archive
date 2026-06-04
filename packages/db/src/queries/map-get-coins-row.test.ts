import { describe, expect, it } from "vitest"
import {
  mapGetCoinsRowsToCoinRecords,
  type GetCoinsRow,
} from "./map-get-coins-row"

describe("mapGetCoinsRowsToCoinRecords", () => {
  const createdAt = new Date("2026-06-01T12:00:00.000Z")
  const updatedAt = new Date("2026-06-02T12:00:00.000Z")
  const issuerCreatedAt = new Date("2026-05-01T12:00:00.000Z")
  const issuerUpdatedAt = new Date("2026-05-02T12:00:00.000Z")
  const parentCreatedAt = new Date("2026-04-01T12:00:00.000Z")
  const parentUpdatedAt = new Date("2026-04-02T12:00:00.000Z")
  const rulerCreatedAt = new Date("2026-03-01T12:00:00.000Z")
  const rulerUpdatedAt = new Date("2026-03-02T12:00:00.000Z")
  const rulerGroupCreatedAt = new Date("2026-02-01T12:00:00.000Z")
  const rulerGroupUpdatedAt = new Date("2026-02-02T12:00:00.000Z")

  it("maps grouped rows into the exact coin record shape", () => {
    const rows: GetCoinsRow[] = [
      {
        id: "coin-1",
        title: "Silver Test Crown",
        createdAt,
        updatedAt,
        issuerId: "issuer-1",
        issuerCode: "roman-empire",
        issuerName: "Roman Empire",
        issuerCreatedAt,
        issuerUpdatedAt,
        parentIssuerId: "issuer-parent-1",
        parentIssuerCode: "ancient-world",
        parentIssuerName: "Ancient World",
        parentIssuerCreatedAt: parentCreatedAt,
        parentIssuerUpdatedAt: parentUpdatedAt,
        rulerId: "ruler-1",
        rulerCode: "felipe-vi",
        rulerName: "Felipe VI",
        rulerCreatedAt,
        rulerUpdatedAt,
        rulerGroupId: "ruler-group-1",
        rulerGroupCode: "house-of-bourbon",
        rulerGroupName: "House of Bourbon",
        rulerGroupCreatedAt,
        rulerGroupUpdatedAt,
      },
      {
        id: "coin-1",
        title: "Silver Test Crown",
        createdAt,
        updatedAt,
        issuerId: "issuer-1",
        issuerCode: "roman-empire",
        issuerName: "Roman Empire",
        issuerCreatedAt,
        issuerUpdatedAt,
        parentIssuerId: "issuer-parent-1",
        parentIssuerCode: "ancient-world",
        parentIssuerName: "Ancient World",
        parentIssuerCreatedAt: parentCreatedAt,
        parentIssuerUpdatedAt: parentUpdatedAt,
        rulerId: "ruler-2",
        rulerCode: "juan-carlos-i",
        rulerName: "Juan Carlos I",
        rulerCreatedAt,
        rulerUpdatedAt,
        rulerGroupId: null,
        rulerGroupCode: null,
        rulerGroupName: null,
        rulerGroupCreatedAt: null,
        rulerGroupUpdatedAt: null,
      },
    ]

    expect(mapGetCoinsRowsToCoinRecords(rows)).toStrictEqual([
      {
        id: "coin-1",
        title: "Silver Test Crown",
        createdAt,
        updatedAt,
        issuer: {
          id: "issuer-1",
          code: "roman-empire",
          name: "Roman Empire",
          createdAt: issuerCreatedAt,
          updatedAt: issuerUpdatedAt,
          parent: {
            id: "issuer-parent-1",
            code: "ancient-world",
            name: "Ancient World",
            createdAt: parentCreatedAt,
            updatedAt: parentUpdatedAt,
          },
        },
        rulers: [
          {
            id: "ruler-1",
            code: "felipe-vi",
            name: "Felipe VI",
            createdAt: rulerCreatedAt,
            updatedAt: rulerUpdatedAt,
            group: {
              id: "ruler-group-1",
              code: "house-of-bourbon",
              name: "House of Bourbon",
              createdAt: rulerGroupCreatedAt,
              updatedAt: rulerGroupUpdatedAt,
            },
          },
          {
            id: "ruler-2",
            code: "juan-carlos-i",
            name: "Juan Carlos I",
            createdAt: rulerCreatedAt,
            updatedAt: rulerUpdatedAt,
            group: null,
          },
        ],
      },
    ])
  })

  it("sets issuer parent to null and rulers to an empty array when the query row has no linked records", () => {
    const row: GetCoinsRow = {
      id: "coin-2",
      title: "Bronze Test Coin",
      createdAt,
      updatedAt,
      issuerId: "issuer-2",
      issuerCode: "athens",
      issuerName: "Athens",
      issuerCreatedAt,
      issuerUpdatedAt,
      parentIssuerId: null,
      parentIssuerCode: null,
      parentIssuerName: null,
      parentIssuerCreatedAt: null,
      parentIssuerUpdatedAt: null,
      rulerId: null,
      rulerCode: null,
      rulerName: null,
      rulerCreatedAt: null,
      rulerUpdatedAt: null,
      rulerGroupId: null,
      rulerGroupCode: null,
      rulerGroupName: null,
      rulerGroupCreatedAt: null,
      rulerGroupUpdatedAt: null,
    }

    expect(mapGetCoinsRowsToCoinRecords([row])).toStrictEqual([
      {
        id: "coin-2",
        title: "Bronze Test Coin",
        createdAt,
        updatedAt,
        issuer: {
          id: "issuer-2",
          code: "athens",
          name: "Athens",
          createdAt: issuerCreatedAt,
          updatedAt: issuerUpdatedAt,
          parent: null,
        },
        rulers: [],
      },
    ])
  })
})
