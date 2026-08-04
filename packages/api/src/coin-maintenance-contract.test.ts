import { describe, expect, it } from "vitest"

import {
  coinMaintenanceDeleteInputSchema,
  coinMaintenanceDeleteOutputSchema,
  coinMaintenanceDeleteSummaryOutputSchema,
  coinMaintenanceCreateInputSchema,
  coinMaintenanceCreateOutputSchema,
  coinMaintenanceDetailOutputSchema,
  coinMaintenanceListInputSchema,
  coinMaintenanceListOutputSchema,
  coinMaintenanceOptionsOutputSchema,
  coinMaintenanceReplaceInputSchema,
  coinMaintenanceReplaceOutputSchema,
} from "./maintenance-contract"

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

describe("Coin Maintenance create contract", () => {
  it("rejects Issue Years outside PostgreSQL integer storage", () => {
    const valid = coinMaintenanceCreateInputSchema.shape.body.parse({
      title: "2 Pesos",
      comments: null,
      compositionDescription: null,
      compositionId: id,
      currencyId: id,
      diameter: null,
      distributionId: id,
      edgeId: null,
      faceValueNumericValue: "2",
      faceValueText: "2 Pesos",
      isDemonetized: null,
      issuerId: id,
      maxYear: 2_147_483_647,
      mintIds: [],
      minYear: 2_147_483_647,
      mintage: null,
      orientationId: null,
      references: [],
      rimId: null,
      rulerIds: [id],
      shapeId: null,
      surfaces: { obverse: null, reverse: null, edge: null },
      techniqueId: null,
      themeIds: [],
      thickness: null,
      weight: null,
    })

    expect(valid.minYear).toBe(2_147_483_647)
    expect(() =>
      coinMaintenanceCreateInputSchema.shape.body.parse({
        ...valid,
        minYear: 2_147_483_648,
        maxYear: 2_147_483_648,
      })
    ).toThrow()
  })

  it("defines a complete whole-Coin input independently of UI and database types", () => {
    const body = {
      title: "2 Pesos",
      comments: null,
      compositionDescription: "Silver alloy",
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
      mintIds: [id],
      minYear: 2025,
      mintage: "1000000",
      orientationId: null,
      rimId: null,
      rulerIds: [id],
      shapeId: null,
      techniqueId: null,
      themeIds: [id],
      thickness: "1.75",
      weight: "7.20",
      references: [{ catalogueId: id, number: "KM 123" }],
      surfaces: {
        obverse: {
          description: "Portrait",
          lettering: "REPUBLICA",
          imageUploadReference: "opaque-obverse-upload",
          engraverIds: [id],
        },
        reverse: null,
        edge: {
          description: "Reeded",
          lettering: null,
          imageUploadReference: null,
        },
      },
    }

    const result = coinMaintenanceCreateInputSchema.parse({
      headers: { "idempotency-key": "coin-attempt-1" },
      body,
    })

    expect(result.body).toStrictEqual(body)
    expect(() =>
      coinMaintenanceCreateInputSchema.parse({
        headers: { "idempotency-key": "coin-attempt-1" },
        body: { ...body, issuerId: "not-a-uuid" },
      })
    ).toThrow()
    expect(() =>
      coinMaintenanceCreateInputSchema.parse({
        headers: { "idempotency-key": "coin-attempt-1" },
        body: { ...body, unexpectedWebField: "redirect" },
      })
    ).toThrow()
  })

  it("defines 201 with the complete representation, Location, and ETag", () => {
    const data = coinMaintenanceDetailOutputSchema.parse({
      data: {
        id,
        title: "2 Pesos",
        comments: null,
        compositionDescription: null,
        compositionId: id,
        currencyId: id,
        diameter: null,
        distributionId: id,
        edgeId: null,
        faceValueNumericValue: "2",
        faceValueText: "2 Pesos",
        isDemonetized: null,
        issuerId: id,
        maxYear: null,
        mintIds: [],
        minYear: null,
        mintage: null,
        orientationId: null,
        rimId: null,
        rulerIds: [],
        shapeId: null,
        techniqueId: null,
        themeIds: [],
        thickness: null,
        weight: null,
        references: [],
        surfaces: { obverse: null, reverse: null, edge: null },
        version: 1,
        createdAt: "2026-08-03T10:15:30.000Z",
        updatedAt: "2026-08-03T10:15:30.000Z",
        etag: '"opaque-version"',
      },
    })

    expect(
      coinMaintenanceCreateOutputSchema.parse({
        status: 201,
        headers: {
          location: `/api/v1/maintenance/coins/${id}`,
          etag: '"opaque-version"',
        },
        body: data,
      }).body.data.id
    ).toBe(id)
  })
})

describe("Coin Maintenance replacement contract", () => {
  it("requires opaque If-Match and returns 200 with the complete replacement", () => {
    const createBody = coinMaintenanceCreateInputSchema.shape.body.parse({
      title: "2 Pesos",
      comments: null,
      compositionDescription: null,
      compositionId: id,
      currencyId: id,
      diameter: null,
      distributionId: id,
      edgeId: null,
      faceValueNumericValue: "2",
      faceValueText: "2 Pesos",
      isDemonetized: null,
      issuerId: id,
      maxYear: null,
      mintIds: [],
      minYear: null,
      mintage: null,
      orientationId: null,
      references: [],
      rimId: null,
      rulerIds: [id],
      shapeId: null,
      surfaces: { obverse: null, reverse: null, edge: null },
      techniqueId: null,
      themeIds: [],
      thickness: null,
      weight: null,
    })
    const body = {
      ...createBody,
      surfaces: {
        obverse: {
          description: "Portrait",
          lettering: null,
          imageUrl: "https://images.coinarchive.app/obverse.webp",
          imageUploadReference: null,
          engraverIds: [],
        },
        reverse: null,
        edge: null,
      },
    }
    const input = coinMaintenanceReplaceInputSchema.parse({
      params: { uuid: id },
      headers: { "if-match": '"opaque-version"' },
      body,
    })
    const detail = coinMaintenanceDetailOutputSchema.parse({
      data: {
        id,
        ...body,
        surfaces: {
          obverse: {
            description: "Portrait",
            lettering: null,
            imageUrl: "https://images.coinarchive.app/obverse.webp",
            engraverIds: [],
          },
          reverse: null,
          edge: null,
        },
        version: 2,
        createdAt: "2026-08-03T10:15:30.000Z",
        updatedAt: "2026-08-03T10:16:30.000Z",
        etag: '"next-opaque-version"',
      },
    })

    expect(input.headers["if-match"]).toBe('"opaque-version"')
    expect(
      coinMaintenanceReplaceOutputSchema.parse({
        status: 200,
        headers: { etag: detail.data.etag },
        body: detail,
      }).body.data.version
    ).toBe(2)
    expect(() =>
      coinMaintenanceReplaceInputSchema.parse({
        params: { uuid: id },
        body,
      })
    ).toThrow()
  })
})

describe("Coin Maintenance deletion contract", () => {
  it("requires opaque If-Match and returns 204 without a body", () => {
    expect(
      coinMaintenanceDeleteInputSchema.parse({
        params: { uuid: id },
        headers: { "if-match": '"opaque-version"' },
      }).headers["if-match"]
    ).toBe('"opaque-version"')
    expect(
      coinMaintenanceDeleteOutputSchema.parse({ status: 204 })
    ).toStrictEqual({ status: 204 })
    expect(() =>
      coinMaintenanceDeleteInputSchema.parse({ params: { uuid: id } })
    ).toThrow()
  })
})
