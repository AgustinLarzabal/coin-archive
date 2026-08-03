import { describe, expect, it } from "vitest"

import {
  mintCreateInputSchema,
  mintCreateOutputSchema,
  mintDeleteInputSchema,
  mintDetailOutputSchema,
  mintListInputSchema,
  mintListOutputSchema,
  mintMaintenanceProblemDocumentSchema,
  mintMutationBodySchema,
  mintOptionsOutputSchema,
  mintReplaceInputSchema,
} from "./contract"

const mint = {
  id: "018f1a11-aaaa-7000-8000-000000000001",
  code: "madrid",
  name: "Madrid",
  version: 1,
  createdAt: "2026-08-03T10:15:30.000Z",
  updatedAt: "2026-08-03T10:15:30.000Z",
  etag: '"opaque-mint-version"',
}

describe("Mint maintenance contract", () => {
  it("declares stable Mint validation and attribution-conflict codes", () => {
    expect(
      mintMaintenanceProblemDocumentSchema
        .parse({
          type: "https://api.coinarchive.app/problems/mint-validation",
          title: "Mint validation failed",
          status: 422,
          detail: "The Mint could not be saved",
          instance: "/api/v1/maintenance/mints",
          code: "mint_validation_failed",
          invalidParams: [
            {
              name: "/code",
              code: "mint_code_invalid",
              reason: "Mint Code is invalid.",
            },
          ],
        })
        .invalidParams?.at(0)?.code
    ).toBe("mint_code_invalid")
    expect(
      mintMaintenanceProblemDocumentSchema.parse({
        type: "https://api.coinarchive.app/problems/mint-in-use",
        title: "Mint is in use",
        status: 409,
        detail: "Coin Mint Attributions still use this Mint",
        instance: `/api/v1/maintenance/mints/${mint.id}`,
        code: "mint_in_use",
      }).code
    ).toBe("mint_in_use")
  })

  it("exposes cursor reads, compact options, and versioned detail", () => {
    expect(
      mintListInputSchema.parse({
        q: "madrid",
        cursor: "opaque-cursor",
        limit: 100,
        sort: "code",
        order: "desc",
      })
    ).toMatchObject({ limit: 100, sort: "code", order: "desc" })
    expect(() => mintListInputSchema.parse({ limit: 101 })).toThrow()
    expect(
      mintOptionsOutputSchema.parse({
        data: [{ id: mint.id, code: mint.code, name: mint.name }],
        nextCursor: null,
      })
    ).toStrictEqual({
      data: [{ id: mint.id, code: mint.code, name: mint.name }],
      nextCursor: null,
    })
    expect(
      mintListOutputSchema.parse({ data: [mint], nextCursor: null })
    ).toStrictEqual({ data: [mint], nextCursor: null })
    expect(mintDetailOutputSchema.parse({ data: mint })).toStrictEqual({
      data: mint,
    })
  })

  it("requires idempotency and opaque replacement/deletion preconditions", () => {
    expect(
      mintCreateInputSchema.parse({
        headers: { "idempotency-key": "mint-attempt-1" },
        body: { code: " madrid ", name: " Madrid " },
      })
    ).toMatchObject({ body: { code: "madrid", name: "Madrid" } })
    expect(
      mintCreateOutputSchema.parse({
        status: 201,
        headers: {
          etag: mint.etag,
          location: `/api/v1/maintenance/mints/${mint.id}`,
        },
        body: { data: mint },
      })
    ).toMatchObject({ status: 201, body: { data: mint } })
    expect(
      mintReplaceInputSchema.parse({
        params: { uuid: mint.id },
        headers: { "if-match": mint.etag },
        body: { code: mint.code, name: mint.name },
      })
    ).toMatchObject({ headers: { "if-match": mint.etag } })
    expect(
      mintDeleteInputSchema.parse({
        params: { uuid: mint.id },
        headers: { "if-match": mint.etag },
      })
    ).toMatchObject({ headers: { "if-match": mint.etag } })
  })

  it("keeps Mint Code slug validation authoritative", () => {
    expect(
      mintMutationBodySchema.safeParse({ code: "madrid", name: "Madrid" })
        .success
    ).toBe(true)
    expect(
      mintMutationBodySchema.safeParse({ code: "Madrid Mint", name: "Madrid" })
        .success
    ).toBe(false)
  })
})
