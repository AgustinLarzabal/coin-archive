import { describe, expect, it } from "vitest"

import {
  coinMaintenanceDeleteSummaryOutputSchema,
  coinMaintenanceDetailOutputSchema,
  coinMaintenanceListInputSchema,
  coinMaintenanceListOutputSchema,
  coinMaintenanceOptionsOutputSchema,
} from "./contract"

const id = "018f1a11-aaaa-7000-8000-000000000001"

describe("Coin Maintenance read contract", () => {
  it("defines cursor pagination with the supported filters and sort", () => {
    expect(
      coinMaintenanceListInputSchema.parse({
        q: "peso",
        issuer: "argentina",
        ruler: "carlos-iii",
        distribution: "circulation",
        currency: "peso",
        composition: "silver",
        cursor: "opaque",
        limit: 100,
        sort: "updatedAt",
        order: "desc",
      })
    ).toMatchObject({ limit: 100, sort: "updatedAt", order: "desc" })
    expect(() => coinMaintenanceListInputSchema.parse({ limit: 101 })).toThrow()
  })

  it("serializes list timestamps and Issue Years canonically", () => {
    expect(
      coinMaintenanceListOutputSchema.parse({
        data: [
          {
            id,
            title: "2 Pesos",
            issuer: { id, code: "argentina", name: "Argentina" },
            minYear: -44,
            maxYear: -42,
            faceValue: {
              text: "2 Pesos",
              currency: { id, code: "peso", name: "Peso" },
            },
            distribution: { id, code: "circulation", name: "Circulation" },
            composition: { id, code: "silver", name: "Silver" },
            createdAt: "2026-08-03T10:15:30.000Z",
            updatedAt: "2026-08-03T10:15:30.000Z",
          },
        ],
        nextCursor: null,
      }).nextCursor
    ).toBeNull()
  })

  it("defines complete editable aggregate serialization and an opaque ETag", () => {
    const result = coinMaintenanceDetailOutputSchema.parse({
      data: {
        id,
        title: "2 Pesos",
        comments: null,
        compositionDescription: null,
        compositionId: id,
        currencyId: id,
        diameter: "23.50",
        distributionId: id,
        edgeId: null,
        faceValueNumericValue: "2.000000",
        faceValueText: "2 Pesos",
        isDemonetized: null,
        issuerId: id,
        maxYear: 2026,
        mintIds: [],
        minYear: 2025,
        mintage: "1000000",
        orientationId: null,
        rimId: null,
        rulerIds: [id],
        shapeId: null,
        techniqueId: null,
        themeIds: [],
        thickness: null,
        weight: "7.20",
        references: [{ catalogueId: id, number: "123" }],
        surfaces: { obverse: null, reverse: null, edge: null },
        version: 1,
        createdAt: "2026-08-03T10:15:30.000Z",
        updatedAt: "2026-08-03T10:15:30.000Z",
        etag: '"opaque-version"',
      },
    })

    expect(result.data.diameter).toBe("23.50")
    expect(result.data.edgeId).toBeNull()
    expect(result.data.etag).toBe('"opaque-version"')
  })

  it("defines deletion summary and layout-neutral lookup collections", () => {
    expect(
      coinMaintenanceDeleteSummaryOutputSchema.parse({
        data: {
          title: "2 Pesos",
          rulerAttributions: 1,
          mintAttributions: 0,
          themeAttributions: 2,
          catalogueReferences: 1,
          coinSurfaces: 2,
          engraverAttributions: 1,
        },
      }).data.title
    ).toBe("2 Pesos")

    const named = { id, code: "code", name: "Name" }
    const result = coinMaintenanceOptionsOutputSchema.parse({
      data: {
        catalogues: [{ id, code: "KM", title: "World Coins" }],
        compositions: [named],
        currencies: [{ ...named, fullName: "Full name" }],
        distributions: [named],
        edges: [named],
        engravers: [named],
        issuers: [{ ...named, isoCode: "AR" }],
        mints: [named],
        orientations: [named],
        rims: [named],
        rulers: [{ ...named, group: null }],
        shapes: [named],
        mintingTechniques: [named],
        themes: [named],
      },
    })
    expect(Object.keys(result.data)).toHaveLength(14)
  })
})
