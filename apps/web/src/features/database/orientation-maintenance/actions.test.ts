import { describe, expect, it, vi } from "vitest"

import {
  ORIENTATION_AUTHORIZATION_ERROR,
  submitCreateOrientation,
  submitDeleteOrientation,
  submitUpdateOrientation,
} from "./actions"
import {
  ORIENTATION_DUPLICATE_CODE_ERROR,
  ORIENTATION_IN_USE_DELETE_ERROR,
  ORIENTATION_STALE_ERROR,
} from "./orientation-mutation-errors"

const id = "2c717ddb-95a2-4dad-a280-f58a4779aee8"
const etag = '"opaque-version"'
const orientation = {
  id,
  code: "reeded",
  name: "Reeded",
  version: 1,
  createdAt: "2026-08-02T10:15:30.000Z",
  updatedAt: "2026-08-02T10:15:30.000Z",
  etag,
}

function problem(code: string, status: number) {
  return {
    data: {
      body: {
        type: `https://api.coinarchive.app/problems/${code}`,
        title: code,
        status,
        detail: code,
        instance: "/api/v1/maintenance/orientations",
        code,
      },
    },
  }
}

describe("Orientation web mutation adapter", () => {
  it("retains client validation before calling the typed create operation", async () => {
    const createOrientation = vi.fn()

    await expect(
      submitCreateOrientation(
        { code: "Reeded", name: " " },
        { createOrientation, createIdempotencyKey: () => "attempt-1" }
      )
    ).resolves.toMatchObject({
      status: "error",
      fieldErrors: {
        code: expect.any(String),
        name: expect.any(String),
      },
    })
    expect(createOrientation).not.toHaveBeenCalled()
  })

  it("creates through the typed API with a client-owned idempotency key", async () => {
    const createOrientation = vi.fn(async () => ({
      status: 201 as const,
      headers: { etag, location: `/api/v1/maintenance/orientations/${id}` },
      body: { data: orientation },
    }))

    await expect(
      submitCreateOrientation(
        { code: " reeded ", name: " Reeded " },
        { createOrientation, createIdempotencyKey: () => "attempt-1" }
      )
    ).resolves.toStrictEqual({
      status: "success",
      message: "Orientation added.",
    })
    expect(createOrientation).toHaveBeenCalledWith({
      headers: { "idempotency-key": "attempt-1" },
      body: { code: "reeded", name: "Reeded" },
    })
  })

  it("submits the retained opaque ETag for replacement and deletion", async () => {
    const replaceOrientation = vi.fn(async () => ({
      status: 200 as const,
      headers: { etag: '"next-version"' },
      body: { data: { ...orientation, version: 2, etag: '"next-version"' } },
    }))
    const deleteOrientation = vi.fn(async () => ({ status: 204 as const }))

    await expect(
      submitUpdateOrientation(
        { id, etag, code: "plain", name: "Plain" },
        { replaceOrientation }
      )
    ).resolves.toMatchObject({ status: "success", message: "Saved." })
    await expect(
      submitDeleteOrientation({ id, etag }, { deleteOrientation })
    ).resolves.toMatchObject({
      status: "success",
      message: "Orientation deleted.",
    })

    expect(replaceOrientation).toHaveBeenCalledWith({
      params: { uuid: id },
      headers: { "if-match": etag },
      body: { code: "plain", name: "Plain" },
    })
    expect(deleteOrientation).toHaveBeenCalledWith({
      params: { uuid: id },
      headers: { "if-match": etag },
    })
  })

  it("maps API authorization, duplicate, stale, and dependency problems to current feedback", async () => {
    await expect(
      submitCreateOrientation(
        { code: "reeded", name: "Reeded" },
        {
          createOrientation: vi
            .fn()
            .mockRejectedValue(problem("editor_access_required", 403)),
          createIdempotencyKey: () => "attempt-1",
        }
      )
    ).resolves.toMatchObject({ formError: ORIENTATION_AUTHORIZATION_ERROR })

    await expect(
      submitCreateOrientation(
        { code: "reeded", name: "Reeded" },
        {
          createOrientation: vi
            .fn()
            .mockRejectedValue(problem("orientation_code_conflict", 409)),
          createIdempotencyKey: () => "attempt-1",
        }
      )
    ).resolves.toMatchObject({
      fieldErrors: { code: ORIENTATION_DUPLICATE_CODE_ERROR },
    })

    await expect(
      submitUpdateOrientation(
        { id, etag, code: "reeded", name: "Reeded" },
        {
          replaceOrientation: vi
            .fn()
            .mockRejectedValue(problem("orientation_precondition_failed", 412)),
        }
      )
    ).resolves.toMatchObject({ formError: ORIENTATION_STALE_ERROR })

    await expect(
      submitDeleteOrientation(
        { id, etag },
        {
          deleteOrientation: vi
            .fn()
            .mockRejectedValue(problem("orientation_in_use", 409)),
        }
      )
    ).resolves.toMatchObject({ formError: ORIENTATION_IN_USE_DELETE_ERROR })
  })
})
