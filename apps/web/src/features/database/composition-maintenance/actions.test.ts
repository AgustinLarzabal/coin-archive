import { describe, expect, it, vi } from "vitest"

import {
  COMPOSITION_AUTHORIZATION_ERROR,
  submitCreateComposition,
  submitDeleteComposition,
  submitUpdateComposition,
} from "./actions"
import {
  COMPOSITION_DUPLICATE_CODE_ERROR,
  COMPOSITION_IN_USE_DELETE_ERROR,
  COMPOSITION_STALE_ERROR,
} from "./composition-mutation-errors"

const id = "2c717ddb-95a2-4dad-a280-f58a4779aee8"
const etag = '"opaque-version"'
const composition = {
  id,
  code: "silver",
  name: "Silver",
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
        instance: "/api/v1/maintenance/compositions",
        code,
        ...(invalidParams === undefined ? {} : { invalidParams }),
      },
    },
  }
}

describe("Composition web mutation adapter", () => {
  it("retains client validation before calling the typed create operation", async () => {
    const createComposition = vi.fn()

    await expect(
      submitCreateComposition(
        {
          code: " ",
          name: "".padStart(256, "A"),
          idempotencyKey: "attempt-1",
        },
        { createComposition }
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: "Composition Code cannot be blank.",
        name: "Composition Name must be 255 characters or fewer.",
      },
    })
    expect(createComposition).not.toHaveBeenCalled()
  })

  it("creates through the typed API with a client-owned idempotency key", async () => {
    const createComposition = vi.fn(async () => ({
      status: 201 as const,
      headers: { etag, location: `/api/v1/maintenance/compositions/${id}` },
      body: { data: composition },
    }))

    await expect(
      submitCreateComposition(
        {
          code: " silver ",
          name: " Silver ",
          idempotencyKey: "attempt-1",
        },
        { createComposition }
      )
    ).resolves.toStrictEqual({
      status: "success",
      message: "Composition added.",
    })
    expect(createComposition).toHaveBeenCalledWith({
      headers: { "idempotency-key": "attempt-1" },
      body: { code: "silver", name: "Silver" },
    })
  })

  it("reuses the caller-owned idempotency key when a create is retried", async () => {
    const createComposition = vi.fn(async () => ({
      status: 201 as const,
      headers: { etag, location: `/api/v1/maintenance/compositions/${id}` },
      body: { data: composition },
    }))
    const submission = {
      code: "silver",
      name: "Silver",
      idempotencyKey: "stable-attempt",
    }

    await submitCreateComposition(submission, { createComposition })
    await submitCreateComposition(submission, { createComposition })

    expect(createComposition).toHaveBeenCalledTimes(2)
    expect(createComposition).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        headers: { "idempotency-key": "stable-attempt" },
      })
    )
    expect(createComposition).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        headers: { "idempotency-key": "stable-attempt" },
      })
    )
  })

  it("submits the retained opaque ETag for replacement and deletion", async () => {
    const replaceComposition = vi.fn(async () => ({
      status: 200 as const,
      headers: { etag: '"next-version"' },
      body: {
        data: { ...composition, version: 2, etag: '"next-version"' },
      },
    }))
    const deleteComposition = vi.fn(async () => ({ status: 204 as const }))

    await expect(
      submitUpdateComposition(
        { id, etag, code: "gold", name: "Gold" },
        { replaceComposition }
      )
    ).resolves.toMatchObject({ status: "success", message: "Saved." })
    await expect(
      submitDeleteComposition({ id, etag }, { deleteComposition })
    ).resolves.toMatchObject({
      status: "success",
      message: "Composition deleted.",
    })

    expect(replaceComposition).toHaveBeenCalledWith({
      params: { uuid: id },
      headers: { "if-match": etag },
      body: { code: "gold", name: "Gold" },
    })
    expect(deleteComposition).toHaveBeenCalledWith({
      params: { uuid: id },
      headers: { "if-match": etag },
    })
  })

  it("maps API authorization, duplicate, stale, and dependency problems", async () => {
    await expect(
      submitCreateComposition(
        {
          code: "silver",
          name: "Silver",
          idempotencyKey: "attempt-1",
        },
        {
          createComposition: vi
            .fn()
            .mockRejectedValue(problem("editor_access_required", 403)),
        }
      )
    ).resolves.toMatchObject({ formError: COMPOSITION_AUTHORIZATION_ERROR })

    await expect(
      submitCreateComposition(
        {
          code: "silver",
          name: "Silver",
          idempotencyKey: "attempt-1",
        },
        {
          createComposition: vi
            .fn()
            .mockRejectedValue(problem("composition_code_conflict", 409)),
        }
      )
    ).resolves.toMatchObject({
      fieldErrors: { code: COMPOSITION_DUPLICATE_CODE_ERROR },
    })

    await expect(
      submitUpdateComposition(
        { id, etag, code: "silver", name: "Silver" },
        {
          replaceComposition: vi
            .fn()
            .mockRejectedValue(problem("composition_precondition_failed", 412)),
        }
      )
    ).resolves.toMatchObject({ formError: COMPOSITION_STALE_ERROR })

    await expect(
      submitDeleteComposition(
        { id, etag },
        {
          deleteComposition: vi
            .fn()
            .mockRejectedValue(problem("composition_in_use", 409)),
        }
      )
    ).resolves.toMatchObject({ formError: COMPOSITION_IN_USE_DELETE_ERROR })
  })

  it("maps authoritative validation pointers back to current controls", async () => {
    await expect(
      submitCreateComposition(
        {
          code: "silver",
          name: "Silver",
          idempotencyKey: "attempt-1",
        },
        {
          createComposition: vi.fn().mockRejectedValue(
            problem("composition_validation_failed", 422, [
              { name: "/code", code: "composition_code_required" },
              { name: "/name", code: "composition_name_too_long" },
            ])
          ),
        }
      )
    ).resolves.toMatchObject({
      fieldErrors: {
        code: "Composition Code cannot be blank.",
        name: "Composition Name must be 255 characters or fewer.",
      },
    })
  })
})
