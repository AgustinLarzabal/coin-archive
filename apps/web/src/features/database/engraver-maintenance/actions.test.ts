import { describe, expect, it, vi } from "vitest"

import {
  ENGRAVER_AUTHORIZATION_ERROR,
  submitCreateEngraver,
  submitDeleteEngraver,
  submitUpdateEngraver,
} from "./actions"
import {
  ENGRAVER_DUPLICATE_CODE_ERROR,
  ENGRAVER_IN_USE_DELETE_ERROR,
  ENGRAVER_STALE_ERROR,
} from "./engraver-mutation-errors"

const id = "2c717ddb-95a2-4dad-a280-f58a4779aee8"
const etag = '"opaque-version"'
const engraver = {
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
        instance: "/api/v1/maintenance/engravers",
        code,
        ...(invalidParams === undefined ? {} : { invalidParams }),
      },
    },
  }
}

describe("Engraver web mutation adapter", () => {
  it("leaves authoritative validation to the typed API", async () => {
    const createEngraver = vi.fn().mockRejectedValue(
      problem("engraver_validation_failed", 422, [
        { name: "/code", code: "engraver_code_required" },
        { name: "/name", code: "engraver_name_too_long" },
      ])
    )

    await expect(
      submitCreateEngraver(
        {
          code: " ",
          name: "".padStart(256, "A"),
          idempotencyKey: "attempt-1",
        },
        { createEngraver }
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: "Engraver Code cannot be blank.",
        name: "Engraver Name must be 255 characters or fewer.",
      },
    })
    expect(createEngraver).toHaveBeenCalledWith({
      headers: { "idempotency-key": "attempt-1" },
      body: { code: " ", name: "".padStart(256, "A") },
    })
  })

  it("creates through the typed API with a client-owned idempotency key", async () => {
    const createEngraver = vi.fn(async () => ({
      status: 201 as const,
      headers: { etag, location: `/api/v1/maintenance/engravers/${id}` },
      body: { data: engraver },
    }))

    await expect(
      submitCreateEngraver(
        {
          code: " reeded ",
          name: " Reeded ",
          idempotencyKey: "attempt-1",
        },
        { createEngraver }
      )
    ).resolves.toStrictEqual({
      status: "success",
      message: "Engraver added.",
    })
    expect(createEngraver).toHaveBeenCalledWith({
      headers: { "idempotency-key": "attempt-1" },
      body: { code: " reeded ", name: " Reeded " },
    })
  })

  it("reuses the caller-owned idempotency key when a create is retried", async () => {
    const createEngraver = vi.fn(async () => ({
      status: 201 as const,
      headers: { etag, location: `/api/v1/maintenance/engravers/${id}` },
      body: { data: engraver },
    }))
    const submission = {
      code: "reeded",
      name: "Reeded",
      idempotencyKey: "stable-attempt",
    }

    await submitCreateEngraver(submission, { createEngraver })
    await submitCreateEngraver(submission, { createEngraver })

    expect(createEngraver).toHaveBeenCalledTimes(2)
    expect(createEngraver).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        headers: { "idempotency-key": "stable-attempt" },
      })
    )
    expect(createEngraver).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        headers: { "idempotency-key": "stable-attempt" },
      })
    )
  })

  it("submits the retained opaque ETag for replacement and deletion", async () => {
    const replaceEngraver = vi.fn(async () => ({
      status: 200 as const,
      headers: { etag: '"next-version"' },
      body: {
        data: { ...engraver, version: 2, etag: '"next-version"' },
      },
    }))
    const deleteEngraver = vi.fn(async () => ({ status: 204 as const }))

    await expect(
      submitUpdateEngraver(
        { id, etag, code: "plain", name: "Plain" },
        { replaceEngraver }
      )
    ).resolves.toMatchObject({ status: "success", message: "Saved." })
    await expect(
      submitDeleteEngraver({ id, etag }, { deleteEngraver })
    ).resolves.toMatchObject({
      status: "success",
      message: "Engraver deleted.",
    })

    expect(replaceEngraver).toHaveBeenCalledWith({
      params: { uuid: id },
      headers: { "if-match": etag },
      body: { code: "plain", name: "Plain" },
    })
    expect(deleteEngraver).toHaveBeenCalledWith({
      params: { uuid: id },
      headers: { "if-match": etag },
    })
  })

  it("maps API authorization, duplicate, stale, and dependency problems", async () => {
    await expect(
      submitCreateEngraver(
        {
          code: "reeded",
          name: "Reeded",
          idempotencyKey: "attempt-1",
        },
        {
          createEngraver: vi
            .fn()
            .mockRejectedValue(problem("editor_access_required", 403)),
        }
      )
    ).resolves.toMatchObject({ formError: ENGRAVER_AUTHORIZATION_ERROR })

    await expect(
      submitCreateEngraver(
        {
          code: "reeded",
          name: "Reeded",
          idempotencyKey: "attempt-1",
        },
        {
          createEngraver: vi
            .fn()
            .mockRejectedValue(problem("engraver_code_conflict", 409)),
        }
      )
    ).resolves.toMatchObject({
      fieldErrors: { code: ENGRAVER_DUPLICATE_CODE_ERROR },
    })

    await expect(
      submitUpdateEngraver(
        { id, etag, code: "reeded", name: "Reeded" },
        {
          replaceEngraver: vi
            .fn()
            .mockRejectedValue(problem("engraver_precondition_failed", 412)),
        }
      )
    ).resolves.toMatchObject({ formError: ENGRAVER_STALE_ERROR })

    await expect(
      submitDeleteEngraver(
        { id, etag },
        {
          deleteEngraver: vi
            .fn()
            .mockRejectedValue(problem("engraver_in_use", 409)),
        }
      )
    ).resolves.toMatchObject({ formError: ENGRAVER_IN_USE_DELETE_ERROR })
  })

  it("maps authoritative validation pointers back to current controls", async () => {
    await expect(
      submitCreateEngraver(
        {
          code: "reeded",
          name: "Reeded",
          idempotencyKey: "attempt-1",
        },
        {
          createEngraver: vi.fn().mockRejectedValue(
            problem("engraver_validation_failed", 422, [
              { name: "/code", code: "engraver_code_required" },
              { name: "/name", code: "engraver_name_too_long" },
            ])
          ),
        }
      )
    ).resolves.toMatchObject({
      fieldErrors: {
        code: "Engraver Code cannot be blank.",
        name: "Engraver Name must be 255 characters or fewer.",
      },
    })
  })
})
