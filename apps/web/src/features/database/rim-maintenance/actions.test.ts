import { describe, expect, it, vi } from "vitest"

import {
  RIM_AUTHORIZATION_ERROR,
  submitCreateRim,
  submitDeleteRim,
  submitUpdateRim,
} from "./actions"
import {
  RIM_DUPLICATE_CODE_ERROR,
  RIM_IN_USE_DELETE_ERROR,
  RIM_STALE_ERROR,
} from "./rim-mutation-errors"

const id = "2c717ddb-95a2-4dad-a280-f58a4779aee8"
const etag = '"opaque-version"'
const rim = {
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
        instance: "/api/v1/maintenance/rims",
        code,
        ...(invalidParams === undefined ? {} : { invalidParams }),
      },
    },
  }
}

describe("Rim web mutation adapter", () => {
  it("retains client validation before calling the typed create operation", async () => {
    const createRim = vi.fn()

    await expect(
      submitCreateRim(
        {
          code: " ",
          name: "".padStart(256, "A"),
          idempotencyKey: "attempt-1",
        },
        { createRim }
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: "Rim Code cannot be blank.",
        name: "Rim Name must be 255 characters or fewer.",
      },
    })
    expect(createRim).not.toHaveBeenCalled()
  })

  it("creates through the typed API with a client-owned idempotency key", async () => {
    const createRim = vi.fn(async () => ({
      status: 201 as const,
      headers: { etag, location: `/api/v1/maintenance/rims/${id}` },
      body: { data: rim },
    }))

    await expect(
      submitCreateRim(
        {
          code: " reeded ",
          name: " Reeded ",
          idempotencyKey: "attempt-1",
        },
        { createRim }
      )
    ).resolves.toStrictEqual({
      status: "success",
      message: "Rim added.",
    })
    expect(createRim).toHaveBeenCalledWith({
      headers: { "idempotency-key": "attempt-1" },
      body: { code: "reeded", name: "Reeded" },
    })
  })

  it("reuses the caller-owned idempotency key when a create is retried", async () => {
    const createRim = vi.fn(async () => ({
      status: 201 as const,
      headers: { etag, location: `/api/v1/maintenance/rims/${id}` },
      body: { data: rim },
    }))
    const submission = {
      code: "reeded",
      name: "Reeded",
      idempotencyKey: "stable-attempt",
    }

    await submitCreateRim(submission, { createRim })
    await submitCreateRim(submission, { createRim })

    expect(createRim).toHaveBeenCalledTimes(2)
    expect(createRim).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        headers: { "idempotency-key": "stable-attempt" },
      })
    )
    expect(createRim).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        headers: { "idempotency-key": "stable-attempt" },
      })
    )
  })

  it("submits the retained opaque ETag for replacement and deletion", async () => {
    const replaceRim = vi.fn(async () => ({
      status: 200 as const,
      headers: { etag: '"next-version"' },
      body: {
        data: { ...rim, version: 2, etag: '"next-version"' },
      },
    }))
    const deleteRim = vi.fn(async () => ({ status: 204 as const }))

    await expect(
      submitUpdateRim(
        { id, etag, code: "plain", name: "Plain" },
        { replaceRim }
      )
    ).resolves.toMatchObject({ status: "success", message: "Saved." })
    await expect(
      submitDeleteRim({ id, etag }, { deleteRim })
    ).resolves.toMatchObject({
      status: "success",
      message: "Rim deleted.",
    })

    expect(replaceRim).toHaveBeenCalledWith({
      params: { uuid: id },
      headers: { "if-match": etag },
      body: { code: "plain", name: "Plain" },
    })
    expect(deleteRim).toHaveBeenCalledWith({
      params: { uuid: id },
      headers: { "if-match": etag },
    })
  })

  it("maps API authorization, duplicate, stale, and dependency problems", async () => {
    await expect(
      submitCreateRim(
        {
          code: "reeded",
          name: "Reeded",
          idempotencyKey: "attempt-1",
        },
        {
          createRim: vi
            .fn()
            .mockRejectedValue(problem("editor_access_required", 403)),
        }
      )
    ).resolves.toMatchObject({ formError: RIM_AUTHORIZATION_ERROR })

    await expect(
      submitCreateRim(
        {
          code: "reeded",
          name: "Reeded",
          idempotencyKey: "attempt-1",
        },
        {
          createRim: vi
            .fn()
            .mockRejectedValue(problem("rim_code_conflict", 409)),
        }
      )
    ).resolves.toMatchObject({
      fieldErrors: { code: RIM_DUPLICATE_CODE_ERROR },
    })

    await expect(
      submitUpdateRim(
        { id, etag, code: "reeded", name: "Reeded" },
        {
          replaceRim: vi
            .fn()
            .mockRejectedValue(problem("rim_precondition_failed", 412)),
        }
      )
    ).resolves.toMatchObject({ formError: RIM_STALE_ERROR })

    await expect(
      submitDeleteRim(
        { id, etag },
        {
          deleteRim: vi.fn().mockRejectedValue(problem("rim_in_use", 409)),
        }
      )
    ).resolves.toMatchObject({ formError: RIM_IN_USE_DELETE_ERROR })
  })

  it("maps authoritative validation pointers back to current controls", async () => {
    await expect(
      submitCreateRim(
        {
          code: "reeded",
          name: "Reeded",
          idempotencyKey: "attempt-1",
        },
        {
          createRim: vi.fn().mockRejectedValue(
            problem("rim_validation_failed", 422, [
              { name: "/code", code: "rim_code_required" },
              { name: "/name", code: "rim_name_too_long" },
            ])
          ),
        }
      )
    ).resolves.toMatchObject({
      fieldErrors: {
        code: "Rim Code cannot be blank.",
        name: "Rim Name must be 255 characters or fewer.",
      },
    })
  })
})
