import { describe, expect, it, vi } from "vitest"

import {
  RULER_AUTHORIZATION_ERROR,
  submitCreateRuler,
  submitDeleteRuler,
  submitUpdateRuler,
} from "./actions"
import {
  RULER_DUPLICATE_CODE_ERROR,
  RULER_IN_USE_DELETE_ERROR,
  RULER_MISSING_RULER_GROUP_ERROR,
  RULER_STALE_ERROR,
} from "./ruler-mutation-errors"

const id = "2c717ddb-95a2-4dad-a280-f58a4779aee8"
const etag = '"opaque-version"'
const ruler = {
  id,
  code: "reeded",
  name: "Reeded",
  group: null,
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
        instance: "/api/v1/maintenance/rulers",
        code,
        ...(invalidParams === undefined ? {} : { invalidParams }),
      },
    },
  }
}

describe("Ruler web mutation adapter", () => {
  it("leaves authoritative validation to the typed API", async () => {
    const createRuler = vi.fn().mockRejectedValue(
      problem("ruler_validation_failed", 422, [
        { name: "/code", code: "ruler_code_required" },
        { name: "/name", code: "ruler_name_too_long" },
      ])
    )

    await expect(
      submitCreateRuler(
        {
          code: " ",
          name: "".padStart(256, "A"),
          rulerGroupId: null,
          idempotencyKey: "attempt-1",
        },
        { createRuler }
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: "Ruler Code cannot be blank.",
        name: "Ruler Name must be 255 characters or fewer.",
      },
    })
    expect(createRuler).toHaveBeenCalledWith({
      headers: { "idempotency-key": "attempt-1" },
      body: { code: " ", name: "".padStart(256, "A"), rulerGroupId: null },
    })
  })

  it("creates through the typed API with a client-owned idempotency key", async () => {
    const createRuler = vi.fn(async () => ({
      status: 201 as const,
      headers: {
        etag,
        location: `/api/v1/maintenance/rulers/${id}`,
      },
      body: { data: ruler },
    }))

    await expect(
      submitCreateRuler(
        {
          code: " reeded ",
          name: " Reeded ",
          rulerGroupId: null,
          idempotencyKey: "attempt-1",
        },
        { createRuler }
      )
    ).resolves.toStrictEqual({
      status: "success",
      message: "Ruler added.",
    })
    expect(createRuler).toHaveBeenCalledWith({
      headers: { "idempotency-key": "attempt-1" },
      body: { code: " reeded ", name: " Reeded ", rulerGroupId: null },
    })
  })

  it("reuses the caller-owned idempotency key when a create is retried", async () => {
    const createRuler = vi.fn(async () => ({
      status: 201 as const,
      headers: {
        etag,
        location: `/api/v1/maintenance/rulers/${id}`,
      },
      body: { data: ruler },
    }))
    const submission = {
      code: "reeded",
      name: "Reeded",
      rulerGroupId: null,
      idempotencyKey: "stable-attempt",
    }

    await submitCreateRuler(submission, { createRuler })
    await submitCreateRuler(submission, { createRuler })

    expect(createRuler).toHaveBeenCalledTimes(2)
    expect(createRuler).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        headers: { "idempotency-key": "stable-attempt" },
      })
    )
    expect(createRuler).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        headers: { "idempotency-key": "stable-attempt" },
      })
    )
  })

  it("submits the retained opaque ETag for replacement and deletion", async () => {
    const replaceRuler = vi.fn(async () => ({
      status: 200 as const,
      headers: { etag: '"next-version"' },
      body: {
        data: { ...ruler, version: 2, etag: '"next-version"' },
      },
    }))
    const deleteRuler = vi.fn(async () => ({ status: 204 as const }))

    await expect(
      submitUpdateRuler(
        { id, etag, code: "plain", name: "Plain", rulerGroupId: null },
        { replaceRuler }
      )
    ).resolves.toMatchObject({ status: "success", message: "Saved." })
    await expect(
      submitDeleteRuler({ id, etag }, { deleteRuler })
    ).resolves.toMatchObject({
      status: "success",
      message: "Ruler deleted.",
    })

    expect(replaceRuler).toHaveBeenCalledWith({
      params: { uuid: id },
      headers: { "if-match": etag },
      body: { code: "plain", name: "Plain", rulerGroupId: null },
    })
    expect(deleteRuler).toHaveBeenCalledWith({
      params: { uuid: id },
      headers: { "if-match": etag },
    })
  })

  it("maps API authorization, duplicate, stale, and dependency problems", async () => {
    await expect(
      submitCreateRuler(
        {
          code: "reeded",
          name: "Reeded",
          rulerGroupId: null,
          idempotencyKey: "attempt-1",
        },
        {
          createRuler: vi
            .fn()
            .mockRejectedValue(problem("editor_access_required", 403)),
        }
      )
    ).resolves.toMatchObject({
      formError: RULER_AUTHORIZATION_ERROR,
    })

    await expect(
      submitCreateRuler(
        {
          code: "reeded",
          name: "Reeded",
          rulerGroupId: null,
          idempotencyKey: "attempt-1",
        },
        {
          createRuler: vi
            .fn()
            .mockRejectedValue(problem("ruler_code_conflict", 409)),
        }
      )
    ).resolves.toMatchObject({
      fieldErrors: { code: RULER_DUPLICATE_CODE_ERROR },
    })

    await expect(
      submitUpdateRuler(
        { id, etag, code: "reeded", name: "Reeded", rulerGroupId: null },
        {
          replaceRuler: vi
            .fn()
            .mockRejectedValue(problem("ruler_precondition_failed", 412)),
        }
      )
    ).resolves.toMatchObject({ formError: RULER_STALE_ERROR })

    await expect(
      submitDeleteRuler(
        { id, etag },
        {
          deleteRuler: vi.fn().mockRejectedValue(problem("ruler_in_use", 409)),
        }
      )
    ).resolves.toMatchObject({
      formError: RULER_IN_USE_DELETE_ERROR,
    })

    await expect(
      submitCreateRuler(
        {
          code: "felipe-v",
          name: "Felipe V",
          rulerGroupId: "6f18a1db-9096-433b-b3f1-906c772f7a29",
          idempotencyKey: "attempt-missing-group",
        },
        {
          createRuler: vi
            .fn()
            .mockRejectedValue(problem("ruler_group_not_found", 422)),
        }
      )
    ).resolves.toMatchObject({
      fieldErrors: { rulerGroupId: RULER_MISSING_RULER_GROUP_ERROR },
    })
  })

  it("maps authoritative validation pointers back to current controls", async () => {
    await expect(
      submitCreateRuler(
        {
          code: "reeded",
          name: "Reeded",
          rulerGroupId: null,
          idempotencyKey: "attempt-1",
        },
        {
          createRuler: vi.fn().mockRejectedValue(
            problem("ruler_validation_failed", 422, [
              { name: "/code", code: "ruler_code_required" },
              { name: "/name", code: "ruler_name_too_long" },
            ])
          ),
        }
      )
    ).resolves.toMatchObject({
      fieldErrors: {
        code: "Ruler Code cannot be blank.",
        name: "Ruler Name must be 255 characters or fewer.",
      },
    })
  })
})
