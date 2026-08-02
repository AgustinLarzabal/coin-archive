import { describe, expect, it } from "vitest"

import {
  maintenanceProblemDocumentSchema,
  orientationCreateInputSchema,
  orientationCreateOutputSchema,
  orientationDeleteInputSchema,
  orientationDetailOutputSchema,
  orientationListInputSchema,
  orientationListOutputSchema,
  orientationOptionsOutputSchema,
  orientationReplaceInputSchema,
} from "./contract"

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
