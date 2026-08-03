import { describe, expect, it } from "vitest"

import {
  catalogueCreateInputSchema,
  catalogueCreateOutputSchema,
  catalogueDeleteInputSchema,
  catalogueDetailOutputSchema,
  catalogueListInputSchema,
  catalogueListOutputSchema,
  catalogueOptionsOutputSchema,
  catalogueReplaceInputSchema,
  compositionCreateInputSchema,
  compositionCreateOutputSchema,
  compositionDeleteInputSchema,
  compositionDetailOutputSchema,
  compositionListInputSchema,
  compositionListOutputSchema,
  compositionOptionsOutputSchema,
  compositionReplaceInputSchema,
  distributionCreateInputSchema,
  distributionCreateOutputSchema,
  distributionDeleteInputSchema,
  distributionDetailOutputSchema,
  distributionListInputSchema,
  distributionListOutputSchema,
  distributionOptionsOutputSchema,
  distributionReplaceInputSchema,
  edgeCreateInputSchema,
  edgeCreateOutputSchema,
  edgeDeleteInputSchema,
  edgeDetailOutputSchema,
  edgeListInputSchema,
  edgeListOutputSchema,
  edgeOptionsOutputSchema,
  edgeMaintenanceProblemDocumentSchema,
  edgeReplaceInputSchema,
  currencyCreateInputSchema,
  currencyCreateOutputSchema,
  currencyDeleteInputSchema,
  currencyDetailOutputSchema,
  currencyListInputSchema,
  currencyListOutputSchema,
  currencyOptionsOutputSchema,
  currencyReplaceInputSchema,
  maintenanceProblemDocumentSchema,
  orientationCreateInputSchema,
  orientationCreateOutputSchema,
  orientationDeleteInputSchema,
  orientationDetailOutputSchema,
  orientationListInputSchema,
  orientationListOutputSchema,
  orientationOptionsOutputSchema,
  orientationReplaceInputSchema,
  rimCreateInputSchema,
  rimCreateOutputSchema,
  rimDeleteInputSchema,
  rimDetailOutputSchema,
  rimListInputSchema,
  rimListOutputSchema,
  rimMaintenanceProblemDocumentSchema,
  rimOptionsOutputSchema,
  rimReplaceInputSchema,
  shapeCreateInputSchema,
  shapeCreateOutputSchema,
  shapeDeleteInputSchema,
  shapeDetailOutputSchema,
  shapeListInputSchema,
  shapeListOutputSchema,
  shapeMaintenanceProblemDocumentSchema,
  shapeOptionsOutputSchema,
  shapeReplaceInputSchema,
  engraverCreateInputSchema,
  engraverCreateOutputSchema,
  engraverDeleteInputSchema,
  engraverDetailOutputSchema,
  engraverListInputSchema,
  engraverListOutputSchema,
  engraverMaintenanceProblemDocumentSchema,
  engraverOptionsOutputSchema,
  engraverReplaceInputSchema,
  mintingTechniqueCreateInputSchema,
  mintingTechniqueCreateOutputSchema,
  mintingTechniqueDeleteInputSchema,
  mintingTechniqueDetailOutputSchema,
  mintingTechniqueListInputSchema,
  mintingTechniqueListOutputSchema,
  mintingTechniqueMaintenanceProblemDocumentSchema,
  mintingTechniqueOptionsOutputSchema,
  mintingTechniqueReplaceInputSchema,
} from "./contract"

const currency = {
  id: "018f1a11-aaaa-7000-8000-000000000004",
  code: "united-states-dollar",
  name: "Dollar",
  fullName: "United States dollar",
  version: 1,
  createdAt: "2026-08-02T10:15:30.000Z",
  updatedAt: "2026-08-02T10:15:30.000Z",
  etag: '"opaque-currency-version"',
}

const composition = {
  id: "018f1a11-aaaa-7000-8000-000000000003",
  code: "silver",
  name: "Silver",
  version: 1,
  createdAt: "2026-08-02T10:15:30.000Z",
  updatedAt: "2026-08-02T10:15:30.000Z",
  etag: '"opaque-composition-version"',
}

const distribution = {
  id: "018f1a11-aaaa-7000-8000-000000000005",
  code: "standard-circulation",
  name: "Standard circulation",
  version: 1,
  createdAt: "2026-08-02T10:15:30.000Z",
  updatedAt: "2026-08-02T10:15:30.000Z",
  etag: '"opaque-distribution-version"',
}

const edge = {
  id: "018f1a11-aaaa-7000-8000-000000000006",
  code: "reeded",
  name: "Reeded",
  version: 1,
  createdAt: "2026-08-02T10:15:30.000Z",
  updatedAt: "2026-08-02T10:15:30.000Z",
  etag: '"opaque-edge-version"',
}

const rim = {
  id: "018f1a11-aaaa-7000-8000-000000000007",
  code: "raised-both-sides",
  name: "Raised on both sides",
  version: 1,
  createdAt: "2026-08-02T10:15:30.000Z",
  updatedAt: "2026-08-02T10:15:30.000Z",
  etag: '"opaque-rim-version"',
}

const shape = {
  id: "018f1a11-aaaa-7000-8000-000000000007",
  code: "raised-both-sides",
  name: "Raised on both sides",
  version: 1,
  createdAt: "2026-08-02T10:15:30.000Z",
  updatedAt: "2026-08-02T10:15:30.000Z",
  etag: '"opaque-shape-version"',
}

const engraver = {
  id: "018f1a11-aaaa-7000-8000-000000000007",
  code: "raised-both-sides",
  name: "Raised on both sides",
  version: 1,
  createdAt: "2026-08-02T10:15:30.000Z",
  updatedAt: "2026-08-02T10:15:30.000Z",
  etag: '"opaque-engraver-version"',
}

const mintingTechnique = {
  id: "018f1a11-aaaa-7000-8000-000000000008",
  code: "hammered",
  name: "Hammered",
  version: 1,
  createdAt: "2026-08-02T10:15:30.000Z",
  updatedAt: "2026-08-02T10:15:30.000Z",
  etag: '"opaque-minting-technique-version"',
}

const catalogue = {
  id: "018f1a11-aaaa-7000-8000-000000000002",
  code: "KM",
  title: "Standard Catalog of World Coins",
  version: 1,
  createdAt: "2026-08-02T10:15:30.000Z",
  updatedAt: "2026-08-02T10:15:30.000Z",
  etag: '"opaque-catalogue-version"',
}

const orientation = {
  id: "018f1a11-aaaa-7000-8000-000000000001",
  code: "coin-alignment",
  name: "Coin alignment",
  version: 1,
  createdAt: "2026-08-02T10:15:30.000Z",
  updatedAt: "2026-08-02T10:15:30.000Z",
  etag: '"opaque-orientation-version"',
}

describe("Orientation maintenance contract", () => {
  it("defines bounded cursor pagination with explicit search and sort inputs", () => {
    expect(
      orientationListInputSchema.parse({
        cursor: "opaque-cursor",
        limit: 100,
        q: "alignment",
        sort: "code",
        order: "desc",
      })
    ).toStrictEqual({
      cursor: "opaque-cursor",
      limit: 100,
      q: "alignment",
      sort: "code",
      order: "desc",
    })

    expect(() => orientationListInputSchema.parse({ limit: 101 })).toThrow()
  })

  it("uses canonical JSON strings for UUIDs and timestamps in collection and detail output", () => {
    expect(
      orientationListOutputSchema.parse({
        data: [orientation],
        nextCursor: null,
      })
    ).toStrictEqual({ data: [orientation], nextCursor: null })

    expect(
      orientationDetailOutputSchema.parse({ data: orientation })
    ).toStrictEqual({ data: orientation })

    expect(() =>
      orientationDetailOutputSchema.parse({
        data: { ...orientation, createdAt: new Date(orientation.createdAt) },
      })
    ).toThrow()
    expect(() =>
      orientationDetailOutputSchema.parse({
        data: { ...orientation, createdAt: "2026-08-02T12:15:30+02:00" },
      })
    ).toThrow()
  })

  it("requires stable machine-readable codes on maintenance problems", () => {
    expect(() =>
      maintenanceProblemDocumentSchema.parse({
        type: "https://api.coinarchive.app/problems/401",
        title: "Authentication required",
        status: 401,
        detail: "A valid Collector session is required",
        instance: "/api/v1/maintenance/orientations",
      })
    ).toThrow()
  })

  it("defines compact Orientation options separately from mutable detail data", () => {
    expect(
      orientationOptionsOutputSchema.parse({
        data: [
          {
            id: orientation.id,
            code: orientation.code,
            name: orientation.name,
          },
        ],
        nextCursor: null,
      })
    ).toStrictEqual({
      data: [
        {
          id: orientation.id,
          code: orientation.code,
          name: orientation.name,
        },
      ],
      nextCursor: null,
    })
  })

  it("defines authoritative create input and a header-preserving 201 response", () => {
    expect(
      orientationCreateInputSchema.parse({
        headers: { "idempotency-key": "create-attempt-1" },
        body: { code: " coin-alignment ", name: " Coin alignment " },
      })
    ).toStrictEqual({
      headers: { "idempotency-key": "create-attempt-1" },
      body: { code: "coin-alignment", name: "Coin alignment" },
    })
    expect(
      orientationCreateOutputSchema.parse({
        status: 201,
        headers: {
          etag: orientation.etag,
          location: `/api/v1/maintenance/orientations/${orientation.id}`,
        },
        body: { data: orientation },
      })
    ).toMatchObject({ status: 201, body: { data: orientation } })
    expect(() =>
      orientationCreateInputSchema.parse({
        headers: { "idempotency-key": "attempt" },
        body: { code: "Coin Alignment", name: "Coin alignment" },
      })
    ).toThrow()
  })

  it("requires opaque preconditions for whole replacement and deletion", () => {
    expect(
      orientationReplaceInputSchema.parse({
        params: { uuid: orientation.id },
        headers: { "if-match": orientation.etag },
        body: { code: orientation.code, name: orientation.name },
      })
    ).toMatchObject({ headers: { "if-match": orientation.etag } })
    expect(
      orientationDeleteInputSchema.parse({
        params: { uuid: orientation.id },
        headers: { "if-match": orientation.etag },
      })
    ).toStrictEqual({
      params: { uuid: orientation.id },
      headers: { "if-match": orientation.etag },
    })
  })

  it("addresses validation failures with stable JSON pointers and codes", () => {
    expect(
      maintenanceProblemDocumentSchema.parse({
        type: "https://api.coinarchive.app/problems/validation-failed",
        title: "Orientation validation failed",
        status: 422,
        detail: "The Orientation could not be saved",
        instance: "/api/v1/maintenance/orientations",
        code: "orientation_validation_failed",
        invalidParams: [
          {
            name: "/code",
            code: "invalid_orientation_code",
            reason: "Orientation Code must use lowercase slug-style text.",
          },
        ],
      })
    ).toMatchObject({
      invalidParams: [{ name: "/code", code: "invalid_orientation_code" }],
    })
  })
})

describe("Catalogue maintenance contract", () => {
  it("defines bounded cursor pagination and compact options", () => {
    expect(
      catalogueListInputSchema.parse({
        cursor: "opaque-cursor",
        limit: 100,
        q: "world",
        sort: "title",
        order: "desc",
      })
    ).toStrictEqual({
      cursor: "opaque-cursor",
      limit: 100,
      q: "world",
      sort: "title",
      order: "desc",
    })
    expect(() => catalogueListInputSchema.parse({ limit: 101 })).toThrow()
    expect(
      catalogueOptionsOutputSchema.parse({
        data: [
          {
            id: catalogue.id,
            code: catalogue.code,
            title: catalogue.title,
          },
        ],
        nextCursor: null,
      })
    ).toStrictEqual({
      data: [
        {
          id: catalogue.id,
          code: catalogue.code,
          title: catalogue.title,
        },
      ],
      nextCursor: null,
    })
  })

  it("uses canonical mutable representations for lists and detail", () => {
    expect(
      catalogueListOutputSchema.parse({ data: [catalogue], nextCursor: null })
    ).toStrictEqual({ data: [catalogue], nextCursor: null })
    expect(
      catalogueDetailOutputSchema.parse({ data: catalogue })
    ).toStrictEqual({ data: catalogue })
    expect(() =>
      catalogueDetailOutputSchema.parse({
        data: { ...catalogue, createdAt: new Date(catalogue.createdAt) },
      })
    ).toThrow()
  })

  it("normalizes authoritative mutation input and preserves success headers", () => {
    expect(
      catalogueCreateInputSchema.parse({
        headers: { "idempotency-key": "create-attempt-1" },
        body: { code: " KM ", title: " World Coins " },
      })
    ).toStrictEqual({
      headers: { "idempotency-key": "create-attempt-1" },
      body: { code: "KM", title: "World Coins" },
    })
    expect(
      catalogueCreateOutputSchema.parse({
        status: 201,
        headers: {
          etag: catalogue.etag,
          location: `/api/v1/maintenance/catalogues/${catalogue.id}`,
        },
        body: { data: catalogue },
      })
    ).toMatchObject({ status: 201, body: { data: catalogue } })
  })

  it("requires opaque preconditions for replacement and deletion", () => {
    expect(
      catalogueReplaceInputSchema.parse({
        params: { uuid: catalogue.id },
        headers: { "if-match": catalogue.etag },
        body: { code: catalogue.code, title: catalogue.title },
      })
    ).toMatchObject({ headers: { "if-match": catalogue.etag } })
    expect(
      catalogueDeleteInputSchema.parse({
        params: { uuid: catalogue.id },
        headers: { "if-match": catalogue.etag },
      })
    ).toStrictEqual({
      params: { uuid: catalogue.id },
      headers: { "if-match": catalogue.etag },
    })
  })
})

describe("Composition maintenance contract", () => {
  it("defines bounded cursor pagination and compact options", () => {
    expect(
      compositionListInputSchema.parse({
        cursor: "opaque-cursor",
        limit: 100,
        q: "silver",
        sort: "name",
        order: "desc",
      })
    ).toStrictEqual({
      cursor: "opaque-cursor",
      limit: 100,
      q: "silver",
      sort: "name",
      order: "desc",
    })
    expect(() => compositionListInputSchema.parse({ limit: 101 })).toThrow()
    expect(
      compositionOptionsOutputSchema.parse({
        data: [
          {
            id: composition.id,
            code: composition.code,
            name: composition.name,
          },
        ],
        nextCursor: null,
      })
    ).toStrictEqual({
      data: [
        {
          id: composition.id,
          code: composition.code,
          name: composition.name,
        },
      ],
      nextCursor: null,
    })
  })

  it("uses canonical mutable representations for lists and detail", () => {
    expect(
      compositionListOutputSchema.parse({
        data: [composition],
        nextCursor: null,
      })
    ).toStrictEqual({ data: [composition], nextCursor: null })
    expect(
      compositionDetailOutputSchema.parse({ data: composition })
    ).toStrictEqual({ data: composition })
    expect(() =>
      compositionDetailOutputSchema.parse({
        data: { ...composition, createdAt: new Date(composition.createdAt) },
      })
    ).toThrow()
  })

  it("normalizes authoritative mutation input and preserves success headers", () => {
    expect(
      compositionCreateInputSchema.parse({
        headers: { "idempotency-key": "create-attempt-1" },
        body: { code: " silver ", name: " Silver " },
      })
    ).toStrictEqual({
      headers: { "idempotency-key": "create-attempt-1" },
      body: { code: "silver", name: "Silver" },
    })
    expect(
      compositionCreateOutputSchema.parse({
        status: 201,
        headers: {
          etag: composition.etag,
          location: `/api/v1/maintenance/compositions/${composition.id}`,
        },
        body: { data: composition },
      })
    ).toMatchObject({ status: 201, body: { data: composition } })
    expect(() =>
      compositionCreateInputSchema.parse({
        headers: { "idempotency-key": "attempt" },
        body: { code: "Silver Alloy", name: "Silver" },
      })
    ).toThrow()
  })

  it("requires opaque preconditions for replacement and deletion", () => {
    expect(
      compositionReplaceInputSchema.parse({
        params: { uuid: composition.id },
        headers: { "if-match": composition.etag },
        body: { code: composition.code, name: composition.name },
      })
    ).toMatchObject({ headers: { "if-match": composition.etag } })
    expect(
      compositionDeleteInputSchema.parse({
        params: { uuid: composition.id },
        headers: { "if-match": composition.etag },
      })
    ).toStrictEqual({
      params: { uuid: composition.id },
      headers: { "if-match": composition.etag },
    })
  })
})

describe("Distribution maintenance contract", () => {
  it("defines bounded cursor pagination and compact options", () => {
    expect(
      distributionListInputSchema.parse({
        cursor: "opaque-cursor",
        limit: 100,
        q: "silver",
        sort: "name",
        order: "desc",
      })
    ).toStrictEqual({
      cursor: "opaque-cursor",
      limit: 100,
      q: "silver",
      sort: "name",
      order: "desc",
    })
    expect(() => distributionListInputSchema.parse({ limit: 101 })).toThrow()
    expect(
      distributionOptionsOutputSchema.parse({
        data: [
          {
            id: distribution.id,
            code: distribution.code,
            name: distribution.name,
          },
        ],
        nextCursor: null,
      })
    ).toStrictEqual({
      data: [
        {
          id: distribution.id,
          code: distribution.code,
          name: distribution.name,
        },
      ],
      nextCursor: null,
    })
  })

  it("uses canonical mutable representations for lists and detail", () => {
    expect(
      distributionListOutputSchema.parse({
        data: [distribution],
        nextCursor: null,
      })
    ).toStrictEqual({ data: [distribution], nextCursor: null })
    expect(
      distributionDetailOutputSchema.parse({ data: distribution })
    ).toStrictEqual({ data: distribution })
    expect(() =>
      distributionDetailOutputSchema.parse({
        data: { ...distribution, createdAt: new Date(distribution.createdAt) },
      })
    ).toThrow()
  })

  it("normalizes authoritative mutation input and preserves success headers", () => {
    expect(
      distributionCreateInputSchema.parse({
        headers: { "idempotency-key": "create-attempt-1" },
        body: { code: " silver ", name: " Silver " },
      })
    ).toStrictEqual({
      headers: { "idempotency-key": "create-attempt-1" },
      body: { code: "silver", name: "Silver" },
    })
    expect(
      distributionCreateOutputSchema.parse({
        status: 201,
        headers: {
          etag: distribution.etag,
          location: `/api/v1/maintenance/distributions/${distribution.id}`,
        },
        body: { data: distribution },
      })
    ).toMatchObject({ status: 201, body: { data: distribution } })
    expect(() =>
      distributionCreateInputSchema.parse({
        headers: { "idempotency-key": "attempt" },
        body: { code: "Silver Alloy", name: "Silver" },
      })
    ).toThrow()
  })

  it("requires opaque preconditions for replacement and deletion", () => {
    expect(
      distributionReplaceInputSchema.parse({
        params: { uuid: distribution.id },
        headers: { "if-match": distribution.etag },
        body: { code: distribution.code, name: distribution.name },
      })
    ).toMatchObject({ headers: { "if-match": distribution.etag } })
    expect(
      distributionDeleteInputSchema.parse({
        params: { uuid: distribution.id },
        headers: { "if-match": distribution.etag },
      })
    ).toStrictEqual({
      params: { uuid: distribution.id },
      headers: { "if-match": distribution.etag },
    })
  })
})

describe("Edge maintenance contract", () => {
  it("declares stable Edge validation and dependent-Coin conflict codes", () => {
    expect(
      edgeMaintenanceProblemDocumentSchema
        .parse({
          type: "https://api.coinarchive.app/problems/edge-validation",
          title: "Edge validation failed",
          status: 422,
          detail: "The Edge could not be saved",
          instance: "/api/v1/maintenance/edges",
          code: "edge_validation_failed",
          invalidParams: [
            {
              name: "/code",
              code: "edge_code_invalid",
              reason: "Edge Code is invalid.",
            },
          ],
        })
        .invalidParams?.at(0)?.code
    ).toBe("edge_code_invalid")
    expect(
      edgeMaintenanceProblemDocumentSchema.parse({
        type: "https://api.coinarchive.app/problems/edge-in-use",
        title: "Edge is in use",
        status: 409,
        detail: "Coins still use this Edge",
        instance: `/api/v1/maintenance/edges/${edge.id}`,
        code: "edge_in_use",
      }).code
    ).toBe("edge_in_use")
  })

  it("defines bounded cursor pagination and compact options", () => {
    expect(
      edgeListInputSchema.parse({
        cursor: "opaque-cursor",
        limit: 100,
        q: "reeded",
        sort: "name",
        order: "desc",
      })
    ).toStrictEqual({
      cursor: "opaque-cursor",
      limit: 100,
      q: "reeded",
      sort: "name",
      order: "desc",
    })
    expect(() => edgeListInputSchema.parse({ limit: 101 })).toThrow()
    expect(
      edgeOptionsOutputSchema.parse({
        data: [{ id: edge.id, code: edge.code, name: edge.name }],
        nextCursor: null,
      })
    ).toStrictEqual({
      data: [{ id: edge.id, code: edge.code, name: edge.name }],
      nextCursor: null,
    })
  })

  it("uses canonical mutable representations for lists and detail", () => {
    expect(
      edgeListOutputSchema.parse({ data: [edge], nextCursor: null })
    ).toStrictEqual({ data: [edge], nextCursor: null })
    expect(edgeDetailOutputSchema.parse({ data: edge })).toStrictEqual({
      data: edge,
    })
    expect(() =>
      edgeDetailOutputSchema.parse({
        data: { ...edge, createdAt: new Date(edge.createdAt) },
      })
    ).toThrow()
  })

  it("normalizes slug-style mutation input and preserves success headers", () => {
    expect(
      edgeCreateInputSchema.parse({
        headers: { "idempotency-key": "create-attempt-1" },
        body: { code: " reeded ", name: " Reeded " },
      })
    ).toStrictEqual({
      headers: { "idempotency-key": "create-attempt-1" },
      body: { code: "reeded", name: "Reeded" },
    })
    expect(
      edgeCreateOutputSchema.parse({
        status: 201,
        headers: {
          etag: edge.etag,
          location: `/api/v1/maintenance/edges/${edge.id}`,
        },
        body: { data: edge },
      })
    ).toMatchObject({ status: 201, body: { data: edge } })
    expect(() =>
      edgeCreateInputSchema.parse({
        headers: { "idempotency-key": "attempt" },
        body: { code: "Reeded Edge", name: "Reeded" },
      })
    ).toThrow()
  })

  it("requires opaque preconditions for replacement and deletion", () => {
    expect(
      edgeReplaceInputSchema.parse({
        params: { uuid: edge.id },
        headers: { "if-match": edge.etag },
        body: { code: edge.code, name: edge.name },
      })
    ).toMatchObject({ headers: { "if-match": edge.etag } })
    expect(
      edgeDeleteInputSchema.parse({
        params: { uuid: edge.id },
        headers: { "if-match": edge.etag },
      })
    ).toStrictEqual({
      params: { uuid: edge.id },
      headers: { "if-match": edge.etag },
    })
  })
})

describe("Rim maintenance contract", () => {
  it("declares stable Rim validation and dependent-Coin conflict codes", () => {
    expect(
      rimMaintenanceProblemDocumentSchema
        .parse({
          type: "https://api.coinarchive.app/problems/rim-validation",
          title: "Rim validation failed",
          status: 422,
          detail: "The Rim could not be saved",
          instance: "/api/v1/maintenance/rims",
          code: "rim_validation_failed",
          invalidParams: [
            {
              name: "/code",
              code: "rim_code_invalid",
              reason: "Rim Code is invalid.",
            },
          ],
        })
        .invalidParams?.at(0)?.code
    ).toBe("rim_code_invalid")
    expect(
      rimMaintenanceProblemDocumentSchema.parse({
        type: "https://api.coinarchive.app/problems/rim-in-use",
        title: "Rim is in use",
        status: 409,
        detail: "Coins still use this Rim",
        instance: `/api/v1/maintenance/rims/${rim.id}`,
        code: "rim_in_use",
      }).code
    ).toBe("rim_in_use")
  })

  it("defines bounded cursor pagination and compact options", () => {
    expect(
      rimListInputSchema.parse({
        cursor: "opaque-cursor",
        limit: 100,
        q: "reeded",
        sort: "name",
        order: "desc",
      })
    ).toStrictEqual({
      cursor: "opaque-cursor",
      limit: 100,
      q: "reeded",
      sort: "name",
      order: "desc",
    })
    expect(() => rimListInputSchema.parse({ limit: 101 })).toThrow()
    expect(
      rimOptionsOutputSchema.parse({
        data: [{ id: rim.id, code: rim.code, name: rim.name }],
        nextCursor: null,
      })
    ).toStrictEqual({
      data: [{ id: rim.id, code: rim.code, name: rim.name }],
      nextCursor: null,
    })
  })

  it("uses canonical mutable representations for lists and detail", () => {
    expect(
      rimListOutputSchema.parse({ data: [rim], nextCursor: null })
    ).toStrictEqual({ data: [rim], nextCursor: null })
    expect(rimDetailOutputSchema.parse({ data: rim })).toStrictEqual({
      data: rim,
    })
    expect(() =>
      rimDetailOutputSchema.parse({
        data: { ...rim, createdAt: new Date(rim.createdAt) },
      })
    ).toThrow()
  })

  it("normalizes slug-style mutation input and preserves success headers", () => {
    expect(
      rimCreateInputSchema.parse({
        headers: { "idempotency-key": "create-attempt-1" },
        body: { code: " reeded ", name: " Reeded " },
      })
    ).toStrictEqual({
      headers: { "idempotency-key": "create-attempt-1" },
      body: { code: "reeded", name: "Reeded" },
    })
    expect(
      rimCreateOutputSchema.parse({
        status: 201,
        headers: {
          etag: rim.etag,
          location: `/api/v1/maintenance/rims/${rim.id}`,
        },
        body: { data: rim },
      })
    ).toMatchObject({ status: 201, body: { data: rim } })
    expect(() =>
      rimCreateInputSchema.parse({
        headers: { "idempotency-key": "attempt" },
        body: { code: "Reeded Rim", name: "Reeded" },
      })
    ).toThrow()
  })

  it("requires opaque preconditions for replacement and deletion", () => {
    expect(
      rimReplaceInputSchema.parse({
        params: { uuid: rim.id },
        headers: { "if-match": rim.etag },
        body: { code: rim.code, name: rim.name },
      })
    ).toMatchObject({ headers: { "if-match": rim.etag } })
    expect(
      rimDeleteInputSchema.parse({
        params: { uuid: rim.id },
        headers: { "if-match": rim.etag },
      })
    ).toStrictEqual({
      params: { uuid: rim.id },
      headers: { "if-match": rim.etag },
    })
  })
})

describe("Shape maintenance contract", () => {
  it("declares stable Shape validation and dependent-Coin conflict codes", () => {
    expect(
      shapeMaintenanceProblemDocumentSchema
        .parse({
          type: "https://api.coinarchive.app/problems/shape-validation",
          title: "Shape validation failed",
          status: 422,
          detail: "The Shape could not be saved",
          instance: "/api/v1/maintenance/shapes",
          code: "shape_validation_failed",
          invalidParams: [
            {
              name: "/code",
              code: "shape_code_invalid",
              reason: "Shape Code is invalid.",
            },
          ],
        })
        .invalidParams?.at(0)?.code
    ).toBe("shape_code_invalid")
    expect(
      shapeMaintenanceProblemDocumentSchema.parse({
        type: "https://api.coinarchive.app/problems/shape-in-use",
        title: "Shape is in use",
        status: 409,
        detail: "Coins still use this Shape",
        instance: `/api/v1/maintenance/shapes/${shape.id}`,
        code: "shape_in_use",
      }).code
    ).toBe("shape_in_use")
  })

  it("defines bounded cursor pagination and compact options", () => {
    expect(
      shapeListInputSchema.parse({
        cursor: "opaque-cursor",
        limit: 100,
        q: "reeded",
        sort: "name",
        order: "desc",
      })
    ).toStrictEqual({
      cursor: "opaque-cursor",
      limit: 100,
      q: "reeded",
      sort: "name",
      order: "desc",
    })
    expect(() => shapeListInputSchema.parse({ limit: 101 })).toThrow()
    expect(
      shapeOptionsOutputSchema.parse({
        data: [{ id: shape.id, code: shape.code, name: shape.name }],
        nextCursor: null,
      })
    ).toStrictEqual({
      data: [{ id: shape.id, code: shape.code, name: shape.name }],
      nextCursor: null,
    })
  })

  it("uses canonical mutable representations for lists and detail", () => {
    expect(
      shapeListOutputSchema.parse({ data: [shape], nextCursor: null })
    ).toStrictEqual({ data: [shape], nextCursor: null })
    expect(shapeDetailOutputSchema.parse({ data: shape })).toStrictEqual({
      data: shape,
    })
    expect(() =>
      shapeDetailOutputSchema.parse({
        data: { ...shape, createdAt: new Date(shape.createdAt) },
      })
    ).toThrow()
  })

  it("normalizes slug-style mutation input and preserves success headers", () => {
    expect(
      shapeCreateInputSchema.parse({
        headers: { "idempotency-key": "create-attempt-1" },
        body: { code: " reeded ", name: " Reeded " },
      })
    ).toStrictEqual({
      headers: { "idempotency-key": "create-attempt-1" },
      body: { code: "reeded", name: "Reeded" },
    })
    expect(
      shapeCreateOutputSchema.parse({
        status: 201,
        headers: {
          etag: shape.etag,
          location: `/api/v1/maintenance/shapes/${shape.id}`,
        },
        body: { data: shape },
      })
    ).toMatchObject({ status: 201, body: { data: shape } })
    expect(() =>
      shapeCreateInputSchema.parse({
        headers: { "idempotency-key": "attempt" },
        body: { code: "Reeded Shape", name: "Reeded" },
      })
    ).toThrow()
  })

  it("requires opaque preconditions for replacement and deletion", () => {
    expect(
      shapeReplaceInputSchema.parse({
        params: { uuid: shape.id },
        headers: { "if-match": shape.etag },
        body: { code: shape.code, name: shape.name },
      })
    ).toMatchObject({ headers: { "if-match": shape.etag } })
    expect(
      shapeDeleteInputSchema.parse({
        params: { uuid: shape.id },
        headers: { "if-match": shape.etag },
      })
    ).toStrictEqual({
      params: { uuid: shape.id },
      headers: { "if-match": shape.etag },
    })
  })
})

describe("Engraver maintenance contract", () => {
  it("declares stable Engraver validation and face-attribution conflict codes", () => {
    expect(
      engraverMaintenanceProblemDocumentSchema
        .parse({
          type: "https://api.coinarchive.app/problems/engraver-validation",
          title: "Engraver validation failed",
          status: 422,
          detail: "The Engraver could not be saved",
          instance: "/api/v1/maintenance/engravers",
          code: "engraver_validation_failed",
          invalidParams: [
            {
              name: "/code",
              code: "engraver_code_invalid",
              reason: "Engraver Code is invalid.",
            },
          ],
        })
        .invalidParams?.at(0)?.code
    ).toBe("engraver_code_invalid")
    expect(
      engraverMaintenanceProblemDocumentSchema.parse({
        type: "https://api.coinarchive.app/problems/engraver-in-use",
        title: "Engraver is in use",
        status: 409,
        detail: "Engraver Attributions still use this Engraver",
        instance: `/api/v1/maintenance/engravers/${engraver.id}`,
        code: "engraver_in_use",
      }).code
    ).toBe("engraver_in_use")
  })

  it("defines bounded cursor pagination and compact options", () => {
    expect(
      engraverListInputSchema.parse({
        cursor: "opaque-cursor",
        limit: 100,
        q: "reeded",
        sort: "name",
        order: "desc",
      })
    ).toStrictEqual({
      cursor: "opaque-cursor",
      limit: 100,
      q: "reeded",
      sort: "name",
      order: "desc",
    })
    expect(() => engraverListInputSchema.parse({ limit: 101 })).toThrow()
    expect(
      engraverOptionsOutputSchema.parse({
        data: [{ id: engraver.id, code: engraver.code, name: engraver.name }],
        nextCursor: null,
      })
    ).toStrictEqual({
      data: [{ id: engraver.id, code: engraver.code, name: engraver.name }],
      nextCursor: null,
    })
  })

  it("uses canonical mutable representations for lists and detail", () => {
    expect(
      engraverListOutputSchema.parse({ data: [engraver], nextCursor: null })
    ).toStrictEqual({ data: [engraver], nextCursor: null })
    expect(engraverDetailOutputSchema.parse({ data: engraver })).toStrictEqual({
      data: engraver,
    })
    expect(() =>
      engraverDetailOutputSchema.parse({
        data: { ...engraver, createdAt: new Date(engraver.createdAt) },
      })
    ).toThrow()
  })

  it("normalizes slug-style mutation input and preserves success headers", () => {
    expect(
      engraverCreateInputSchema.parse({
        headers: { "idempotency-key": "create-attempt-1" },
        body: { code: " reeded ", name: " Reeded " },
      })
    ).toStrictEqual({
      headers: { "idempotency-key": "create-attempt-1" },
      body: { code: "reeded", name: "Reeded" },
    })
    expect(
      engraverCreateOutputSchema.parse({
        status: 201,
        headers: {
          etag: engraver.etag,
          location: `/api/v1/maintenance/engravers/${engraver.id}`,
        },
        body: { data: engraver },
      })
    ).toMatchObject({ status: 201, body: { data: engraver } })
    expect(() =>
      engraverCreateInputSchema.parse({
        headers: { "idempotency-key": "attempt" },
        body: { code: "Reeded Engraver", name: "Reeded" },
      })
    ).toThrow()
  })

  it("requires opaque preconditions for replacement and deletion", () => {
    expect(
      engraverReplaceInputSchema.parse({
        params: { uuid: engraver.id },
        headers: { "if-match": engraver.etag },
        body: { code: engraver.code, name: engraver.name },
      })
    ).toMatchObject({ headers: { "if-match": engraver.etag } })
    expect(
      engraverDeleteInputSchema.parse({
        params: { uuid: engraver.id },
        headers: { "if-match": engraver.etag },
      })
    ).toStrictEqual({
      params: { uuid: engraver.id },
      headers: { "if-match": engraver.etag },
    })
  })
})

describe("Minting Technique maintenance contract", () => {
  it("declares stable Minting Technique validation and dependent-Coin conflict codes", () => {
    expect(
      mintingTechniqueMaintenanceProblemDocumentSchema
        .parse({
          type: "https://api.coinarchive.app/problems/minting-technique-validation",
          title: "Minting Technique validation failed",
          status: 422,
          detail: "The Minting Technique could not be saved",
          instance: "/api/v1/maintenance/minting-techniques",
          code: "minting_technique_validation_failed",
          invalidParams: [
            {
              name: "/code",
              code: "minting_technique_code_invalid",
              reason: "Minting Technique Code is invalid.",
            },
          ],
        })
        .invalidParams?.at(0)?.code
    ).toBe("minting_technique_code_invalid")
    expect(
      mintingTechniqueMaintenanceProblemDocumentSchema.parse({
        type: "https://api.coinarchive.app/problems/minting-technique-in-use",
        title: "Minting Technique is in use",
        status: 409,
        detail: "Coins still use this Minting Technique",
        instance: `/api/v1/maintenance/minting-techniques/${mintingTechnique.id}`,
        code: "minting_technique_in_use",
      }).code
    ).toBe("minting_technique_in_use")
  })

  it("defines bounded cursor pagination and compact options", () => {
    expect(
      mintingTechniqueListInputSchema.parse({
        cursor: "opaque-cursor",
        limit: 100,
        q: "hammered",
        sort: "name",
        order: "desc",
      })
    ).toStrictEqual({
      cursor: "opaque-cursor",
      limit: 100,
      q: "hammered",
      sort: "name",
      order: "desc",
    })
    expect(() =>
      mintingTechniqueListInputSchema.parse({ limit: 101 })
    ).toThrow()
    expect(
      mintingTechniqueOptionsOutputSchema.parse({
        data: [
          {
            id: mintingTechnique.id,
            code: mintingTechnique.code,
            name: mintingTechnique.name,
          },
        ],
        nextCursor: null,
      })
    ).toStrictEqual({
      data: [
        {
          id: mintingTechnique.id,
          code: mintingTechnique.code,
          name: mintingTechnique.name,
        },
      ],
      nextCursor: null,
    })
  })

  it("uses canonical mutable representations for lists and detail", () => {
    expect(
      mintingTechniqueListOutputSchema.parse({
        data: [mintingTechnique],
        nextCursor: null,
      })
    ).toStrictEqual({ data: [mintingTechnique], nextCursor: null })
    expect(
      mintingTechniqueDetailOutputSchema.parse({ data: mintingTechnique })
    ).toStrictEqual({
      data: mintingTechnique,
    })
    expect(() =>
      mintingTechniqueDetailOutputSchema.parse({
        data: {
          ...mintingTechnique,
          createdAt: new Date(mintingTechnique.createdAt),
        },
      })
    ).toThrow()
  })

  it("normalizes slug-style mutation input and preserves success headers", () => {
    expect(
      mintingTechniqueCreateInputSchema.parse({
        headers: { "idempotency-key": "create-attempt-1" },
        body: { code: " hammered ", name: " Hammered " },
      })
    ).toStrictEqual({
      headers: { "idempotency-key": "create-attempt-1" },
      body: { code: "hammered", name: "Hammered" },
    })
    expect(
      mintingTechniqueCreateOutputSchema.parse({
        status: 201,
        headers: {
          etag: mintingTechnique.etag,
          location: `/api/v1/maintenance/minting-techniques/${mintingTechnique.id}`,
        },
        body: { data: mintingTechnique },
      })
    ).toMatchObject({ status: 201, body: { data: mintingTechnique } })
    expect(() =>
      mintingTechniqueCreateInputSchema.parse({
        headers: { "idempotency-key": "attempt" },
        body: { code: "Hammered Technique", name: "Hammered" },
      })
    ).toThrow()
  })

  it("requires opaque preconditions for replacement and deletion", () => {
    expect(
      mintingTechniqueReplaceInputSchema.parse({
        params: { uuid: mintingTechnique.id },
        headers: { "if-match": mintingTechnique.etag },
        body: { code: mintingTechnique.code, name: mintingTechnique.name },
      })
    ).toMatchObject({ headers: { "if-match": mintingTechnique.etag } })
    expect(
      mintingTechniqueDeleteInputSchema.parse({
        params: { uuid: mintingTechnique.id },
        headers: { "if-match": mintingTechnique.etag },
      })
    ).toStrictEqual({
      params: { uuid: mintingTechnique.id },
      headers: { "if-match": mintingTechnique.etag },
    })
  })
})

describe("Currency maintenance contract", () => {
  it("defines canonical paginated, option, detail, and mutation representations", () => {
    expect(
      currencyListInputSchema.parse({
        cursor: "opaque-cursor",
        limit: 100,
        q: "dollar",
        sort: "fullName",
        order: "desc",
      })
    ).toStrictEqual({
      cursor: "opaque-cursor",
      limit: 100,
      q: "dollar",
      sort: "fullName",
      order: "desc",
    })
    expect(() => currencyListInputSchema.parse({ limit: 101 })).toThrow()
    expect(
      currencyOptionsOutputSchema.parse({
        data: [
          {
            id: currency.id,
            code: currency.code,
            name: currency.name,
            fullName: currency.fullName,
          },
        ],
        nextCursor: null,
      })
    ).toStrictEqual({
      data: [
        {
          id: currency.id,
          code: currency.code,
          name: currency.name,
          fullName: currency.fullName,
        },
      ],
      nextCursor: null,
    })
    expect(
      currencyListOutputSchema.parse({ data: [currency], nextCursor: null })
    ).toStrictEqual({ data: [currency], nextCursor: null })
    expect(currencyDetailOutputSchema.parse({ data: currency })).toStrictEqual({
      data: currency,
    })
    expect(
      currencyCreateInputSchema.parse({
        headers: { "idempotency-key": "create-attempt-1" },
        body: {
          code: " united-states-dollar ",
          name: " Dollar ",
          fullName: " United States dollar ",
        },
      })
    ).toMatchObject({
      body: {
        code: currency.code,
        name: currency.name,
        fullName: currency.fullName,
      },
    })
    expect(
      currencyCreateOutputSchema.parse({
        status: 201,
        headers: {
          etag: currency.etag,
          location: `/api/v1/maintenance/currencies/${currency.id}`,
        },
        body: { data: currency },
      })
    ).toMatchObject({ status: 201, body: { data: currency } })
    expect(
      currencyReplaceInputSchema.parse({
        params: { uuid: currency.id },
        headers: { "if-match": currency.etag },
        body: {
          code: currency.code,
          name: currency.name,
          fullName: currency.fullName,
        },
      })
    ).toMatchObject({ headers: { "if-match": currency.etag } })
    expect(
      currencyDeleteInputSchema.parse({
        params: { uuid: currency.id },
        headers: { "if-match": currency.etag },
      })
    ).toStrictEqual({
      params: { uuid: currency.id },
      headers: { "if-match": currency.etag },
    })
  })
})
