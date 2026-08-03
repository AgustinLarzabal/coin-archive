import { describe, expect, it, vi } from "vitest"

import {
  MINT_AUTHORIZATION_ERROR,
  submitCreateMint,
  submitDeleteMint,
  submitUpdateMint,
} from "./actions"
import {
  MINT_DUPLICATE_CODE_ERROR,
  MINT_IN_USE_DELETE_ERROR,
  MINT_STALE_ERROR,
} from "./mint-mutation-errors"

const id = "2c717ddb-95a2-4dad-a280-f58a4779aee8"
const etag = '"opaque-version"'
const mint = {
  id,
  code: "madrid",
  name: "Madrid",
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
        instance: "/api/v1/maintenance/mints",
        code,
        ...(invalidParams === undefined ? {} : { invalidParams }),
      },
    },
  }
}

describe("Mint web mutation adapter", () => {
  it("leaves authoritative validation to the typed API", async () => {
    const createMint = vi.fn().mockRejectedValue(
      problem("mint_validation_failed", 422, [
        { name: "/code", code: "mint_code_required" },
        { name: "/name", code: "mint_name_too_long" },
      ])
    )

    await expect(
      submitCreateMint(
        {
          code: " ",
          name: "".padStart(256, "A"),
          idempotencyKey: "attempt-1",
        },
        { createMint }
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: "Mint Code cannot be blank.",
        name: "Mint Name must be 255 characters or fewer.",
      },
    })
    expect(createMint).toHaveBeenCalledWith({
      headers: { "idempotency-key": "attempt-1" },
      body: { code: " ", name: "".padStart(256, "A") },
    })
  })

  it("creates through the typed API with a client-owned idempotency key", async () => {
    const createMint = vi.fn(async () => ({
      status: 201 as const,
      headers: {
        etag,
        location: `/api/v1/maintenance/mints/${id}`,
      },
      body: { data: mint },
    }))

    await expect(
      submitCreateMint(
        {
          code: " madrid ",
          name: " Madrid ",
          idempotencyKey: "attempt-1",
        },
        { createMint }
      )
    ).resolves.toStrictEqual({
      status: "success",
      message: "Mint added.",
    })
    expect(createMint).toHaveBeenCalledWith({
      headers: { "idempotency-key": "attempt-1" },
      body: { code: " madrid ", name: " Madrid " },
    })
  })

  it("reuses the caller-owned idempotency key when a create is retried", async () => {
    const createMint = vi.fn(async () => ({
      status: 201 as const,
      headers: {
        etag,
        location: `/api/v1/maintenance/mints/${id}`,
      },
      body: { data: mint },
    }))
    const submission = {
      code: "madrid",
      name: "Madrid",
      idempotencyKey: "stable-attempt",
    }

    await submitCreateMint(submission, { createMint })
    await submitCreateMint(submission, { createMint })

    expect(createMint).toHaveBeenCalledTimes(2)
    expect(createMint).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        headers: { "idempotency-key": "stable-attempt" },
      })
    )
    expect(createMint).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        headers: { "idempotency-key": "stable-attempt" },
      })
    )
  })

  it("submits the retained opaque ETag for replacement and deletion", async () => {
    const replaceMint = vi.fn(async () => ({
      status: 200 as const,
      headers: { etag: '"next-version"' },
      body: {
        data: { ...mint, version: 2, etag: '"next-version"' },
      },
    }))
    const deleteMint = vi.fn(async () => ({ status: 204 as const }))

    await expect(
      submitUpdateMint(
        { id, etag, code: "london", name: "London" },
        { replaceMint }
      )
    ).resolves.toMatchObject({ status: "success", message: "Saved." })
    await expect(
      submitDeleteMint({ id, etag }, { deleteMint })
    ).resolves.toMatchObject({
      status: "success",
      message: "Mint deleted.",
    })

    expect(replaceMint).toHaveBeenCalledWith({
      params: { uuid: id },
      headers: { "if-match": etag },
      body: { code: "london", name: "London" },
    })
    expect(deleteMint).toHaveBeenCalledWith({
      params: { uuid: id },
      headers: { "if-match": etag },
    })
  })

  it("maps API authorization, duplicate, stale, and dependency problems", async () => {
    await expect(
      submitCreateMint(
        {
          code: "madrid",
          name: "Madrid",
          idempotencyKey: "attempt-1",
        },
        {
          createMint: vi
            .fn()
            .mockRejectedValue(problem("editor_access_required", 403)),
        }
      )
    ).resolves.toMatchObject({
      formError: MINT_AUTHORIZATION_ERROR,
    })

    await expect(
      submitCreateMint(
        {
          code: "madrid",
          name: "Madrid",
          idempotencyKey: "attempt-1",
        },
        {
          createMint: vi
            .fn()
            .mockRejectedValue(problem("mint_code_conflict", 409)),
        }
      )
    ).resolves.toMatchObject({
      fieldErrors: { code: MINT_DUPLICATE_CODE_ERROR },
    })

    await expect(
      submitUpdateMint(
        { id, etag, code: "madrid", name: "Madrid" },
        {
          replaceMint: vi
            .fn()
            .mockRejectedValue(problem("mint_precondition_failed", 412)),
        }
      )
    ).resolves.toMatchObject({ formError: MINT_STALE_ERROR })

    await expect(
      submitDeleteMint(
        { id, etag },
        {
          deleteMint: vi.fn().mockRejectedValue(problem("mint_in_use", 409)),
        }
      )
    ).resolves.toMatchObject({
      formError: MINT_IN_USE_DELETE_ERROR,
    })
  })

  it("maps authoritative validation pointers back to current controls", async () => {
    await expect(
      submitCreateMint(
        {
          code: "madrid",
          name: "Madrid",
          idempotencyKey: "attempt-1",
        },
        {
          createMint: vi.fn().mockRejectedValue(
            problem("mint_validation_failed", 422, [
              { name: "/code", code: "mint_code_required" },
              { name: "/name", code: "mint_name_too_long" },
            ])
          ),
        }
      )
    ).resolves.toMatchObject({
      fieldErrors: {
        code: "Mint Code cannot be blank.",
        name: "Mint Name must be 255 characters or fewer.",
      },
    })
  })
})
