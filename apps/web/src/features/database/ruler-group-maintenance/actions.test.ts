import { describe, expect, it, vi } from "vitest"

import {
  RULER_GROUP_AUTHORIZATION_ERROR,
  submitCreateRulerGroup,
  submitDeleteRulerGroup,
  submitUpdateRulerGroup,
} from "./actions"
import {
  RULER_GROUP_DUPLICATE_CODE_ERROR,
  RULER_GROUP_IN_USE_DELETE_ERROR,
  RULER_GROUP_STALE_ERROR,
} from "./ruler-group-mutation-errors"

const id = "2c717ddb-95a2-4dad-a280-f58a4779aee8"
const etag = '"opaque-version"'
const rulerGroup = {
  id,
  code: "reeded",
  name: "Reeded",
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
        instance: "/api/v1/maintenance/ruler-groups",
        code,
        ...(invalidParams === undefined ? {} : { invalidParams }),
      },
    },
  }
}

describe("RulerGroup web mutation adapter", () => {
  it("leaves authoritative validation to the typed API", async () => {
    const createRulerGroup = vi.fn().mockRejectedValue(
      problem("ruler_group_validation_failed", 422, [
        { name: "/code", code: "ruler_group_code_required" },
        { name: "/name", code: "ruler_group_name_too_long" },
      ])
    )

    await expect(
      submitCreateRulerGroup(
        {
          code: " ",
          name: "".padStart(256, "A"),
          idempotencyKey: "attempt-1",
        },
        { createRulerGroup }
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: "Ruler Group Code cannot be blank.",
        name: "Ruler Group Name must be 255 characters or fewer.",
      },
    })
    expect(createRulerGroup).toHaveBeenCalledWith({
      headers: { "idempotency-key": "attempt-1" },
      body: { code: " ", name: "".padStart(256, "A") },
    })
  })

  it("creates through the typed API with a client-owned idempotency key", async () => {
    const createRulerGroup = vi.fn(async () => ({
      status: 201 as const,
      headers: {
        etag,
        location: `/api/v1/maintenance/ruler-groups/${id}`,
      },
      body: { data: rulerGroup },
    }))

    await expect(
      submitCreateRulerGroup(
        {
          code: " reeded ",
          name: " Reeded ",
          idempotencyKey: "attempt-1",
        },
        { createRulerGroup }
      )
    ).resolves.toStrictEqual({
      status: "success",
      message: "Ruler Group added.",
    })
    expect(createRulerGroup).toHaveBeenCalledWith({
      headers: { "idempotency-key": "attempt-1" },
      body: { code: " reeded ", name: " Reeded " },
    })
  })

  it("reuses the caller-owned idempotency key when a create is retried", async () => {
    const createRulerGroup = vi.fn(async () => ({
      status: 201 as const,
      headers: {
        etag,
        location: `/api/v1/maintenance/ruler-groups/${id}`,
      },
      body: { data: rulerGroup },
    }))
    const submission = {
      code: "reeded",
      name: "Reeded",
      idempotencyKey: "stable-attempt",
    }

    await submitCreateRulerGroup(submission, { createRulerGroup })
    await submitCreateRulerGroup(submission, { createRulerGroup })

    expect(createRulerGroup).toHaveBeenCalledTimes(2)
    expect(createRulerGroup).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        headers: { "idempotency-key": "stable-attempt" },
      })
    )
    expect(createRulerGroup).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        headers: { "idempotency-key": "stable-attempt" },
      })
    )
  })

  it("submits the retained opaque ETag for replacement and deletion", async () => {
    const replaceRulerGroup = vi.fn(async () => ({
      status: 200 as const,
      headers: { etag: '"next-version"' },
      body: {
        data: { ...rulerGroup, version: 2, etag: '"next-version"' },
      },
    }))
    const deleteRulerGroup = vi.fn(async () => ({ status: 204 as const }))

    await expect(
      submitUpdateRulerGroup(
        { id, etag, code: "plain", name: "Plain" },
        { replaceRulerGroup }
      )
    ).resolves.toMatchObject({ status: "success", message: "Saved." })
    await expect(
      submitDeleteRulerGroup({ id, etag }, { deleteRulerGroup })
    ).resolves.toMatchObject({
      status: "success",
      message: "Ruler Group deleted.",
    })

    expect(replaceRulerGroup).toHaveBeenCalledWith({
      params: { uuid: id },
      headers: { "if-match": etag },
      body: { code: "plain", name: "Plain" },
    })
    expect(deleteRulerGroup).toHaveBeenCalledWith({
      params: { uuid: id },
      headers: { "if-match": etag },
    })
  })

  it("maps API authorization, duplicate, stale, and dependency problems", async () => {
    await expect(
      submitCreateRulerGroup(
        {
          code: "reeded",
          name: "Reeded",
          idempotencyKey: "attempt-1",
        },
        {
          createRulerGroup: vi
            .fn()
            .mockRejectedValue(problem("editor_access_required", 403)),
        }
      )
    ).resolves.toMatchObject({
      formError: RULER_GROUP_AUTHORIZATION_ERROR,
    })

    await expect(
      submitCreateRulerGroup(
        {
          code: "reeded",
          name: "Reeded",
          idempotencyKey: "attempt-1",
        },
        {
          createRulerGroup: vi
            .fn()
            .mockRejectedValue(problem("ruler_group_code_conflict", 409)),
        }
      )
    ).resolves.toMatchObject({
      fieldErrors: { code: RULER_GROUP_DUPLICATE_CODE_ERROR },
    })

    await expect(
      submitUpdateRulerGroup(
        { id, etag, code: "reeded", name: "Reeded" },
        {
          replaceRulerGroup: vi
            .fn()
            .mockRejectedValue(problem("ruler_group_precondition_failed", 412)),
        }
      )
    ).resolves.toMatchObject({ formError: RULER_GROUP_STALE_ERROR })

    await expect(
      submitDeleteRulerGroup(
        { id, etag },
        {
          deleteRulerGroup: vi
            .fn()
            .mockRejectedValue(problem("ruler_group_in_use", 409)),
        }
      )
    ).resolves.toMatchObject({
      formError: RULER_GROUP_IN_USE_DELETE_ERROR,
    })
  })

  it("maps authoritative validation pointers back to current controls", async () => {
    await expect(
      submitCreateRulerGroup(
        {
          code: "reeded",
          name: "Reeded",
          idempotencyKey: "attempt-1",
        },
        {
          createRulerGroup: vi.fn().mockRejectedValue(
            problem("ruler_group_validation_failed", 422, [
              { name: "/code", code: "ruler_group_code_required" },
              { name: "/name", code: "ruler_group_name_too_long" },
            ])
          ),
        }
      )
    ).resolves.toMatchObject({
      fieldErrors: {
        code: "Ruler Group Code cannot be blank.",
        name: "Ruler Group Name must be 255 characters or fewer.",
      },
    })
  })
})
