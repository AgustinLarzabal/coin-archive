import { describe, expect, it, vi } from "vitest"

import {
  DISTRIBUTION_AUTHORIZATION_ERROR,
  submitCreateDistribution,
  submitDeleteDistribution,
  submitUpdateDistribution,
} from "./actions"
import {
  DISTRIBUTION_DUPLICATE_CODE_ERROR,
  DISTRIBUTION_IN_USE_DELETE_ERROR,
  DISTRIBUTION_STALE_ERROR,
} from "./distribution-mutation-errors"

const id = "2c717ddb-95a2-4dad-a280-f58a4779aee8"
const etag = '"opaque-version"'
const distribution = {
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
        instance: "/api/v1/maintenance/distributions",
        code,
        ...(invalidParams === undefined ? {} : { invalidParams }),
      },
    },
  }
}

describe("Distribution web mutation adapter", () => {
  it("retains client validation before calling the typed create operation", async () => {
    const createDistribution = vi.fn()

    await expect(
      submitCreateDistribution(
        {
          code: " ",
          name: "".padStart(256, "A"),
          idempotencyKey: "attempt-1",
        },
        { createDistribution }
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: "Distribution Code cannot be blank.",
        name: "Distribution Name must be 255 characters or fewer.",
      },
    })
    expect(createDistribution).not.toHaveBeenCalled()
  })

  it("creates through the typed API with a client-owned idempotency key", async () => {
    const createDistribution = vi.fn(async () => ({
      status: 201 as const,
      headers: { etag, location: `/api/v1/maintenance/distributions/${id}` },
      body: { data: distribution },
    }))

    await expect(
      submitCreateDistribution(
        {
          code: " silver ",
          name: " Silver ",
          idempotencyKey: "attempt-1",
        },
        { createDistribution }
      )
    ).resolves.toStrictEqual({
      status: "success",
      message: "Distribution added.",
    })
    expect(createDistribution).toHaveBeenCalledWith({
      headers: { "idempotency-key": "attempt-1" },
      body: { code: "silver", name: "Silver" },
    })
  })

  it("reuses the caller-owned idempotency key when a create is retried", async () => {
    const createDistribution = vi.fn(async () => ({
      status: 201 as const,
      headers: { etag, location: `/api/v1/maintenance/distributions/${id}` },
      body: { data: distribution },
    }))
    const submission = {
      code: "silver",
      name: "Silver",
      idempotencyKey: "stable-attempt",
    }

    await submitCreateDistribution(submission, { createDistribution })
    await submitCreateDistribution(submission, { createDistribution })

    expect(createDistribution).toHaveBeenCalledTimes(2)
    expect(createDistribution).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        headers: { "idempotency-key": "stable-attempt" },
      })
    )
    expect(createDistribution).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        headers: { "idempotency-key": "stable-attempt" },
      })
    )
  })

  it("submits the retained opaque ETag for replacement and deletion", async () => {
    const replaceDistribution = vi.fn(async () => ({
      status: 200 as const,
      headers: { etag: '"next-version"' },
      body: {
        data: { ...distribution, version: 2, etag: '"next-version"' },
      },
    }))
    const deleteDistribution = vi.fn(async () => ({ status: 204 as const }))

    await expect(
      submitUpdateDistribution(
        { id, etag, code: "gold", name: "Gold" },
        { replaceDistribution }
      )
    ).resolves.toMatchObject({ status: "success", message: "Saved." })
    await expect(
      submitDeleteDistribution({ id, etag }, { deleteDistribution })
    ).resolves.toMatchObject({
      status: "success",
      message: "Distribution deleted.",
    })

    expect(replaceDistribution).toHaveBeenCalledWith({
      params: { uuid: id },
      headers: { "if-match": etag },
      body: { code: "gold", name: "Gold" },
    })
    expect(deleteDistribution).toHaveBeenCalledWith({
      params: { uuid: id },
      headers: { "if-match": etag },
    })
  })

  it("maps API authorization, duplicate, stale, and dependency problems", async () => {
    await expect(
      submitCreateDistribution(
        {
          code: "silver",
          name: "Silver",
          idempotencyKey: "attempt-1",
        },
        {
          createDistribution: vi
            .fn()
            .mockRejectedValue(problem("editor_access_required", 403)),
        }
      )
    ).resolves.toMatchObject({ formError: DISTRIBUTION_AUTHORIZATION_ERROR })

    await expect(
      submitCreateDistribution(
        {
          code: "silver",
          name: "Silver",
          idempotencyKey: "attempt-1",
        },
        {
          createDistribution: vi
            .fn()
            .mockRejectedValue(problem("distribution_code_conflict", 409)),
        }
      )
    ).resolves.toMatchObject({
      fieldErrors: { code: DISTRIBUTION_DUPLICATE_CODE_ERROR },
    })

    await expect(
      submitUpdateDistribution(
        { id, etag, code: "silver", name: "Silver" },
        {
          replaceDistribution: vi
            .fn()
            .mockRejectedValue(
              problem("distribution_precondition_failed", 412)
            ),
        }
      )
    ).resolves.toMatchObject({ formError: DISTRIBUTION_STALE_ERROR })

    await expect(
      submitDeleteDistribution(
        { id, etag },
        {
          deleteDistribution: vi
            .fn()
            .mockRejectedValue(problem("distribution_in_use", 409)),
        }
      )
    ).resolves.toMatchObject({ formError: DISTRIBUTION_IN_USE_DELETE_ERROR })
  })

  it("maps authoritative validation pointers back to current controls", async () => {
    await expect(
      submitCreateDistribution(
        {
          code: "silver",
          name: "Silver",
          idempotencyKey: "attempt-1",
        },
        {
          createDistribution: vi.fn().mockRejectedValue(
            problem("distribution_validation_failed", 422, [
              { name: "/code", code: "distribution_code_required" },
              { name: "/name", code: "distribution_name_too_long" },
            ])
          ),
        }
      )
    ).resolves.toMatchObject({
      fieldErrors: {
        code: "Distribution Code cannot be blank.",
        name: "Distribution Name must be 255 characters or fewer.",
      },
    })
  })
})
