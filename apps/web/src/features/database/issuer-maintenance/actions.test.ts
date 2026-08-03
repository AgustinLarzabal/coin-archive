import { describe, expect, it, vi } from "vitest"

import {
  ISSUER_AUTHORIZATION_ERROR,
  submitCreateIssuer,
  submitDeleteIssuer,
  submitUpdateIssuer,
} from "./actions"
import {
  ISSUER_DUPLICATE_CODE_ERROR,
  ISSUER_COINS_DELETE_ERROR,
  ISSUER_STALE_ERROR,
} from "./issuer-mutation-errors"

const id = "2c717ddb-95a2-4dad-a280-f58a4779aee8"
const etag = '"opaque-version"'
const issuer = {
  id,
  code: "reeded",
  isoCode: "AR",
  name: "Reeded",
  parentIssuerId: null,
  parent: null,
  version: 1,
  createdAt: "2026-08-02T10:15:30.000Z",
  updatedAt: "2026-08-02T10:15:30.000Z",
  etag,
}

function problem(code: string, status: number, invalidParams?: unknown[]) {
  return {
    data: {
      body: {
        type: `https://api.coinarchive.app/problems/${code}`,
        title: code,
        status,
        detail: code,
        instance: "/api/v1/maintenance/issuers",
        code,
        ...(invalidParams === undefined ? {} : { invalidParams }),
      },
    },
  }
}

describe("Issuer web mutation adapter", () => {
  it("leaves authoritative validation to the typed API", async () => {
    const createIssuer = vi.fn().mockRejectedValue(
      problem("issuer_validation_failed", 422, [
        { name: "/code", code: "issuer_code_required" },
        { name: "/name", code: "issuer_name_too_long" },
      ])
    )

    await expect(
      submitCreateIssuer(
        {
          code: " ",
          isoCode: "AR",
          name: "".padStart(256, "A"),
          parentIssuerId: null,
          idempotencyKey: "attempt-1",
        },
        { createIssuer }
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: "Issuer Code cannot be blank.",
        name: "Issuer Name must be 255 characters or fewer.",
      },
    })
    expect(createIssuer).toHaveBeenCalledWith({
      headers: { "idempotency-key": "attempt-1" },
      body: {
        code: " ",
        isoCode: "AR",
        name: "".padStart(256, "A"),
        parentIssuerId: null,
      },
    })
  })

  it("creates through the typed API with a client-owned idempotency key", async () => {
    const createIssuer = vi.fn(async () => ({
      status: 201 as const,
      headers: { etag, location: `/api/v1/maintenance/issuers/${id}` },
      body: { data: issuer },
    }))

    await expect(
      submitCreateIssuer(
        {
          code: " reeded ",
          isoCode: " ar ",
          name: " Reeded ",
          parentIssuerId: null,
          idempotencyKey: "attempt-1",
        },
        { createIssuer }
      )
    ).resolves.toStrictEqual({
      status: "success",
      message: "Issuer added.",
    })
    expect(createIssuer).toHaveBeenCalledWith({
      headers: { "idempotency-key": "attempt-1" },
      body: {
        code: " reeded ",
        isoCode: " ar ",
        name: " Reeded ",
        parentIssuerId: null,
      },
    })
  })

  it("reuses the caller-owned idempotency key when a create is retried", async () => {
    const createIssuer = vi.fn(async () => ({
      status: 201 as const,
      headers: { etag, location: `/api/v1/maintenance/issuers/${id}` },
      body: { data: issuer },
    }))
    const submission = {
      code: "reeded",
      isoCode: "AR",
      name: "Reeded",
      parentIssuerId: null,
      idempotencyKey: "stable-attempt",
    }

    await submitCreateIssuer(submission, { createIssuer })
    await submitCreateIssuer(submission, { createIssuer })

    expect(createIssuer).toHaveBeenCalledTimes(2)
    expect(createIssuer).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        headers: { "idempotency-key": "stable-attempt" },
      })
    )
    expect(createIssuer).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        headers: { "idempotency-key": "stable-attempt" },
      })
    )
  })

  it("submits the retained opaque ETag for replacement and deletion", async () => {
    const replaceIssuer = vi.fn(async () => ({
      status: 200 as const,
      headers: { etag: '"next-version"' },
      body: {
        data: { ...issuer, version: 2, etag: '"next-version"' },
      },
    }))
    const deleteIssuer = vi.fn(async () => ({ status: 204 as const }))

    await expect(
      submitUpdateIssuer(
        {
          id,
          etag,
          code: "plain",
          isoCode: "IT",
          name: "Plain",
          parentIssuerId: null,
        },
        { replaceIssuer }
      )
    ).resolves.toMatchObject({ status: "success", message: "Saved." })
    await expect(
      submitDeleteIssuer({ id, etag }, { deleteIssuer })
    ).resolves.toMatchObject({
      status: "success",
      message: "Issuer deleted.",
    })

    expect(replaceIssuer).toHaveBeenCalledWith({
      params: { uuid: id },
      headers: { "if-match": etag },
      body: {
        code: "plain",
        isoCode: "IT",
        name: "Plain",
        parentIssuerId: null,
      },
    })
    expect(deleteIssuer).toHaveBeenCalledWith({
      params: { uuid: id },
      headers: { "if-match": etag },
    })
  })

  it("maps API authorization, duplicate, stale, and dependency problems", async () => {
    await expect(
      submitCreateIssuer(
        {
          code: "reeded",
          isoCode: "AR",
          name: "Reeded",
          parentIssuerId: null,
          idempotencyKey: "attempt-1",
        },
        {
          createIssuer: vi
            .fn()
            .mockRejectedValue(problem("editor_access_required", 403)),
        }
      )
    ).resolves.toMatchObject({ formError: ISSUER_AUTHORIZATION_ERROR })

    await expect(
      submitCreateIssuer(
        {
          code: "reeded",
          isoCode: "AR",
          name: "Reeded",
          parentIssuerId: null,
          idempotencyKey: "attempt-1",
        },
        {
          createIssuer: vi
            .fn()
            .mockRejectedValue(problem("issuer_code_conflict", 409)),
        }
      )
    ).resolves.toMatchObject({
      fieldErrors: { code: ISSUER_DUPLICATE_CODE_ERROR },
    })

    await expect(
      submitUpdateIssuer(
        {
          id,
          etag,
          code: "reeded",
          isoCode: "AR",
          name: "Reeded",
          parentIssuerId: null,
        },
        {
          replaceIssuer: vi
            .fn()
            .mockRejectedValue(problem("issuer_precondition_failed", 412)),
        }
      )
    ).resolves.toMatchObject({ formError: ISSUER_STALE_ERROR })

    await expect(
      submitDeleteIssuer(
        { id, etag },
        {
          deleteIssuer: vi
            .fn()
            .mockRejectedValue(problem("issuer_in_use", 409)),
        }
      )
    ).resolves.toMatchObject({ formError: ISSUER_COINS_DELETE_ERROR })
  })

  it("maps authoritative validation pointers back to current controls", async () => {
    await expect(
      submitCreateIssuer(
        {
          code: "reeded",
          isoCode: "AR",
          name: "Reeded",
          parentIssuerId: null,
          idempotencyKey: "attempt-1",
        },
        {
          createIssuer: vi.fn().mockRejectedValue(
            problem("issuer_validation_failed", 422, [
              { name: "/code", code: "issuer_code_required" },
              { name: "/name", code: "issuer_name_too_long" },
            ])
          ),
        }
      )
    ).resolves.toMatchObject({
      fieldErrors: {
        code: "Issuer Code cannot be blank.",
        name: "Issuer Name must be 255 characters or fewer.",
      },
    })
  })
})
