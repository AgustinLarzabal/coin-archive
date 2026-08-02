import { describe, expect, it, vi } from "vitest"

import {
  EDGE_AUTHORIZATION_ERROR,
  submitCreateEdge,
  submitDeleteEdge,
  submitUpdateEdge,
} from "./actions"
import {
  EDGE_DUPLICATE_CODE_ERROR,
  EDGE_IN_USE_DELETE_ERROR,
  EDGE_STALE_ERROR,
} from "./edge-mutation-errors"

const id = "2c717ddb-95a2-4dad-a280-f58a4779aee8"
const etag = '"opaque-version"'
const edge = {
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
        instance: "/api/v1/maintenance/edges",
        code,
        ...(invalidParams === undefined ? {} : { invalidParams }),
      },
    },
  }
}

describe("Edge web mutation adapter", () => {
  it("retains client validation before calling the typed create operation", async () => {
    const createEdge = vi.fn()

    await expect(
      submitCreateEdge(
        {
          code: " ",
          name: "".padStart(256, "A"),
          idempotencyKey: "attempt-1",
        },
        { createEdge }
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: "Edge Code cannot be blank.",
        name: "Edge Name must be 255 characters or fewer.",
      },
    })
    expect(createEdge).not.toHaveBeenCalled()
  })

  it("creates through the typed API with a client-owned idempotency key", async () => {
    const createEdge = vi.fn(async () => ({
      status: 201 as const,
      headers: { etag, location: `/api/v1/maintenance/edges/${id}` },
      body: { data: edge },
    }))

    await expect(
      submitCreateEdge(
        {
          code: " silver ",
          name: " Silver ",
          idempotencyKey: "attempt-1",
        },
        { createEdge }
      )
    ).resolves.toStrictEqual({
      status: "success",
      message: "Edge added.",
    })
    expect(createEdge).toHaveBeenCalledWith({
      headers: { "idempotency-key": "attempt-1" },
      body: { code: "silver", name: "Silver" },
    })
  })

  it("reuses the caller-owned idempotency key when a create is retried", async () => {
    const createEdge = vi.fn(async () => ({
      status: 201 as const,
      headers: { etag, location: `/api/v1/maintenance/edges/${id}` },
      body: { data: edge },
    }))
    const submission = {
      code: "silver",
      name: "Silver",
      idempotencyKey: "stable-attempt",
    }

    await submitCreateEdge(submission, { createEdge })
    await submitCreateEdge(submission, { createEdge })

    expect(createEdge).toHaveBeenCalledTimes(2)
    expect(createEdge).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        headers: { "idempotency-key": "stable-attempt" },
      })
    )
    expect(createEdge).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        headers: { "idempotency-key": "stable-attempt" },
      })
    )
  })

  it("submits the retained opaque ETag for replacement and deletion", async () => {
    const replaceEdge = vi.fn(async () => ({
      status: 200 as const,
      headers: { etag: '"next-version"' },
      body: {
        data: { ...edge, version: 2, etag: '"next-version"' },
      },
    }))
    const deleteEdge = vi.fn(async () => ({ status: 204 as const }))

    await expect(
      submitUpdateEdge(
        { id, etag, code: "gold", name: "Gold" },
        { replaceEdge }
      )
    ).resolves.toMatchObject({ status: "success", message: "Saved." })
    await expect(
      submitDeleteEdge({ id, etag }, { deleteEdge })
    ).resolves.toMatchObject({
      status: "success",
      message: "Edge deleted.",
    })

    expect(replaceEdge).toHaveBeenCalledWith({
      params: { uuid: id },
      headers: { "if-match": etag },
      body: { code: "gold", name: "Gold" },
    })
    expect(deleteEdge).toHaveBeenCalledWith({
      params: { uuid: id },
      headers: { "if-match": etag },
    })
  })

  it("maps API authorization, duplicate, stale, and dependency problems", async () => {
    await expect(
      submitCreateEdge(
        {
          code: "silver",
          name: "Silver",
          idempotencyKey: "attempt-1",
        },
        {
          createEdge: vi
            .fn()
            .mockRejectedValue(problem("editor_access_required", 403)),
        }
      )
    ).resolves.toMatchObject({ formError: EDGE_AUTHORIZATION_ERROR })

    await expect(
      submitCreateEdge(
        {
          code: "silver",
          name: "Silver",
          idempotencyKey: "attempt-1",
        },
        {
          createEdge: vi
            .fn()
            .mockRejectedValue(problem("edge_code_conflict", 409)),
        }
      )
    ).resolves.toMatchObject({
      fieldErrors: { code: EDGE_DUPLICATE_CODE_ERROR },
    })

    await expect(
      submitUpdateEdge(
        { id, etag, code: "silver", name: "Silver" },
        {
          replaceEdge: vi
            .fn()
            .mockRejectedValue(problem("edge_precondition_failed", 412)),
        }
      )
    ).resolves.toMatchObject({ formError: EDGE_STALE_ERROR })

    await expect(
      submitDeleteEdge(
        { id, etag },
        {
          deleteEdge: vi.fn().mockRejectedValue(problem("edge_in_use", 409)),
        }
      )
    ).resolves.toMatchObject({ formError: EDGE_IN_USE_DELETE_ERROR })
  })

  it("maps authoritative validation pointers back to current controls", async () => {
    await expect(
      submitCreateEdge(
        {
          code: "silver",
          name: "Silver",
          idempotencyKey: "attempt-1",
        },
        {
          createEdge: vi.fn().mockRejectedValue(
            problem("edge_validation_failed", 422, [
              { name: "/code", code: "edge_code_required" },
              { name: "/name", code: "edge_name_too_long" },
            ])
          ),
        }
      )
    ).resolves.toMatchObject({
      fieldErrors: {
        code: "Edge Code cannot be blank.",
        name: "Edge Name must be 255 characters or fewer.",
      },
    })
  })
})
