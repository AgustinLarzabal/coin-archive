import { describe, expect, it, vi } from "vitest"

import {
  SHAPE_AUTHORIZATION_ERROR,
  submitCreateShape,
  submitDeleteShape,
  submitUpdateShape,
} from "./actions"
import {
  SHAPE_DUPLICATE_CODE_ERROR,
  SHAPE_IN_USE_DELETE_ERROR,
  SHAPE_STALE_ERROR,
} from "./shape-mutation-errors"

const id = "2c717ddb-95a2-4dad-a280-f58a4779aee8"
const etag = '"opaque-version"'
const shape = {
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
        instance: "/api/v1/maintenance/shapes",
        code,
        ...(invalidParams === undefined ? {} : { invalidParams }),
      },
    },
  }
}

describe("Shape web mutation adapter", () => {
  it("leaves authoritative validation to the typed API", async () => {
    const createShape = vi.fn().mockRejectedValue(
      problem("shape_validation_failed", 422, [
        { name: "/code", code: "shape_code_required" },
        { name: "/name", code: "shape_name_too_long" },
      ])
    )

    await expect(
      submitCreateShape(
        {
          code: " ",
          name: "".padStart(256, "A"),
          idempotencyKey: "attempt-1",
        },
        { createShape }
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: "Shape Code cannot be blank.",
        name: "Shape Name must be 255 characters or fewer.",
      },
    })
    expect(createShape).toHaveBeenCalledWith({
      headers: { "idempotency-key": "attempt-1" },
      body: { code: " ", name: "".padStart(256, "A") },
    })
  })

  it("creates through the typed API with a client-owned idempotency key", async () => {
    const createShape = vi.fn(async () => ({
      status: 201 as const,
      headers: { etag, location: `/api/v1/maintenance/shapes/${id}` },
      body: { data: shape },
    }))

    await expect(
      submitCreateShape(
        {
          code: " reeded ",
          name: " Reeded ",
          idempotencyKey: "attempt-1",
        },
        { createShape }
      )
    ).resolves.toStrictEqual({
      status: "success",
      message: "Shape added.",
    })
    expect(createShape).toHaveBeenCalledWith({
      headers: { "idempotency-key": "attempt-1" },
      body: { code: " reeded ", name: " Reeded " },
    })
  })

  it("reuses the caller-owned idempotency key when a create is retried", async () => {
    const createShape = vi.fn(async () => ({
      status: 201 as const,
      headers: { etag, location: `/api/v1/maintenance/shapes/${id}` },
      body: { data: shape },
    }))
    const submission = {
      code: "reeded",
      name: "Reeded",
      idempotencyKey: "stable-attempt",
    }

    await submitCreateShape(submission, { createShape })
    await submitCreateShape(submission, { createShape })

    expect(createShape).toHaveBeenCalledTimes(2)
    expect(createShape).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        headers: { "idempotency-key": "stable-attempt" },
      })
    )
    expect(createShape).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        headers: { "idempotency-key": "stable-attempt" },
      })
    )
  })

  it("submits the retained opaque ETag for replacement and deletion", async () => {
    const replaceShape = vi.fn(async () => ({
      status: 200 as const,
      headers: { etag: '"next-version"' },
      body: {
        data: { ...shape, version: 2, etag: '"next-version"' },
      },
    }))
    const deleteShape = vi.fn(async () => ({ status: 204 as const }))

    await expect(
      submitUpdateShape(
        { id, etag, code: "plain", name: "Plain" },
        { replaceShape }
      )
    ).resolves.toMatchObject({ status: "success", message: "Saved." })
    await expect(
      submitDeleteShape({ id, etag }, { deleteShape })
    ).resolves.toMatchObject({
      status: "success",
      message: "Shape deleted.",
    })

    expect(replaceShape).toHaveBeenCalledWith({
      params: { uuid: id },
      headers: { "if-match": etag },
      body: { code: "plain", name: "Plain" },
    })
    expect(deleteShape).toHaveBeenCalledWith({
      params: { uuid: id },
      headers: { "if-match": etag },
    })
  })

  it("maps API authorization, duplicate, stale, and dependency problems", async () => {
    await expect(
      submitCreateShape(
        {
          code: "reeded",
          name: "Reeded",
          idempotencyKey: "attempt-1",
        },
        {
          createShape: vi
            .fn()
            .mockRejectedValue(problem("editor_access_required", 403)),
        }
      )
    ).resolves.toMatchObject({ formError: SHAPE_AUTHORIZATION_ERROR })

    await expect(
      submitCreateShape(
        {
          code: "reeded",
          name: "Reeded",
          idempotencyKey: "attempt-1",
        },
        {
          createShape: vi
            .fn()
            .mockRejectedValue(problem("shape_code_conflict", 409)),
        }
      )
    ).resolves.toMatchObject({
      fieldErrors: { code: SHAPE_DUPLICATE_CODE_ERROR },
    })

    await expect(
      submitUpdateShape(
        { id, etag, code: "reeded", name: "Reeded" },
        {
          replaceShape: vi
            .fn()
            .mockRejectedValue(problem("shape_precondition_failed", 412)),
        }
      )
    ).resolves.toMatchObject({ formError: SHAPE_STALE_ERROR })

    await expect(
      submitDeleteShape(
        { id, etag },
        {
          deleteShape: vi.fn().mockRejectedValue(problem("shape_in_use", 409)),
        }
      )
    ).resolves.toMatchObject({ formError: SHAPE_IN_USE_DELETE_ERROR })
  })

  it("maps authoritative validation pointers back to current controls", async () => {
    await expect(
      submitCreateShape(
        {
          code: "reeded",
          name: "Reeded",
          idempotencyKey: "attempt-1",
        },
        {
          createShape: vi.fn().mockRejectedValue(
            problem("shape_validation_failed", 422, [
              { name: "/code", code: "shape_code_required" },
              { name: "/name", code: "shape_name_too_long" },
            ])
          ),
        }
      )
    ).resolves.toMatchObject({
      fieldErrors: {
        code: "Shape Code cannot be blank.",
        name: "Shape Name must be 255 characters or fewer.",
      },
    })
  })
})
