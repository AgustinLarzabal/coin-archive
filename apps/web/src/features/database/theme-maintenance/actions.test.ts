import { describe, expect, it, vi } from "vitest"

import {
  THEME_AUTHORIZATION_ERROR,
  submitCreateTheme,
  submitDeleteTheme,
  submitUpdateTheme,
} from "./actions"
import {
  THEME_DUPLICATE_CODE_ERROR,
  THEME_IN_USE_DELETE_ERROR,
  THEME_STALE_ERROR,
} from "./theme-mutation-errors"

const id = "2c717ddb-95a2-4dad-a280-f58a4779aee8"
const etag = '"opaque-version"'
const theme = {
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
        instance: "/api/v1/maintenance/themes",
        code,
        ...(invalidParams === undefined ? {} : { invalidParams }),
      },
    },
  }
}

describe("Theme web mutation adapter", () => {
  it("leaves authoritative validation to the typed API", async () => {
    const createTheme = vi.fn().mockRejectedValue(
      problem("theme_validation_failed", 422, [
        { name: "/code", code: "theme_code_required" },
        { name: "/name", code: "theme_name_too_long" },
      ])
    )

    await expect(
      submitCreateTheme(
        {
          code: " ",
          name: "".padStart(256, "A"),
          idempotencyKey: "attempt-1",
        },
        { createTheme }
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: "Theme Code cannot be blank.",
        name: "Theme Name must be 255 characters or fewer.",
      },
    })
    expect(createTheme).toHaveBeenCalledWith({
      headers: { "idempotency-key": "attempt-1" },
      body: { code: " ", name: "".padStart(256, "A") },
    })
  })

  it("creates through the typed API with a client-owned idempotency key", async () => {
    const createTheme = vi.fn(async () => ({
      status: 201 as const,
      headers: { etag, location: `/api/v1/maintenance/themes/${id}` },
      body: { data: theme },
    }))

    await expect(
      submitCreateTheme(
        {
          code: " reeded ",
          name: " Reeded ",
          idempotencyKey: "attempt-1",
        },
        { createTheme }
      )
    ).resolves.toStrictEqual({
      status: "success",
      message: "Theme added.",
    })
    expect(createTheme).toHaveBeenCalledWith({
      headers: { "idempotency-key": "attempt-1" },
      body: { code: " reeded ", name: " Reeded " },
    })
  })

  it("reuses the caller-owned idempotency key when a create is retried", async () => {
    const createTheme = vi.fn(async () => ({
      status: 201 as const,
      headers: { etag, location: `/api/v1/maintenance/themes/${id}` },
      body: { data: theme },
    }))
    const submission = {
      code: "reeded",
      name: "Reeded",
      idempotencyKey: "stable-attempt",
    }

    await submitCreateTheme(submission, { createTheme })
    await submitCreateTheme(submission, { createTheme })

    expect(createTheme).toHaveBeenCalledTimes(2)
    expect(createTheme).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        headers: { "idempotency-key": "stable-attempt" },
      })
    )
    expect(createTheme).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        headers: { "idempotency-key": "stable-attempt" },
      })
    )
  })

  it("submits the retained opaque ETag for replacement and deletion", async () => {
    const replaceTheme = vi.fn(async () => ({
      status: 200 as const,
      headers: { etag: '"next-version"' },
      body: {
        data: { ...theme, version: 2, etag: '"next-version"' },
      },
    }))
    const deleteTheme = vi.fn(async () => ({ status: 204 as const }))

    await expect(
      submitUpdateTheme(
        { id, etag, code: "plain", name: "Plain" },
        { replaceTheme }
      )
    ).resolves.toMatchObject({ status: "success", message: "Saved." })
    await expect(
      submitDeleteTheme({ id, etag }, { deleteTheme })
    ).resolves.toMatchObject({
      status: "success",
      message: "Theme deleted.",
    })

    expect(replaceTheme).toHaveBeenCalledWith({
      params: { uuid: id },
      headers: { "if-match": etag },
      body: { code: "plain", name: "Plain" },
    })
    expect(deleteTheme).toHaveBeenCalledWith({
      params: { uuid: id },
      headers: { "if-match": etag },
    })
  })

  it("maps API authorization, duplicate, stale, and dependency problems", async () => {
    await expect(
      submitCreateTheme(
        {
          code: "reeded",
          name: "Reeded",
          idempotencyKey: "attempt-1",
        },
        {
          createTheme: vi
            .fn()
            .mockRejectedValue(problem("editor_access_required", 403)),
        }
      )
    ).resolves.toMatchObject({ formError: THEME_AUTHORIZATION_ERROR })

    await expect(
      submitCreateTheme(
        {
          code: "reeded",
          name: "Reeded",
          idempotencyKey: "attempt-1",
        },
        {
          createTheme: vi
            .fn()
            .mockRejectedValue(problem("theme_code_conflict", 409)),
        }
      )
    ).resolves.toMatchObject({
      fieldErrors: { code: THEME_DUPLICATE_CODE_ERROR },
    })

    await expect(
      submitUpdateTheme(
        { id, etag, code: "reeded", name: "Reeded" },
        {
          replaceTheme: vi
            .fn()
            .mockRejectedValue(problem("theme_precondition_failed", 412)),
        }
      )
    ).resolves.toMatchObject({ formError: THEME_STALE_ERROR })

    await expect(
      submitDeleteTheme(
        { id, etag },
        {
          deleteTheme: vi.fn().mockRejectedValue(problem("theme_in_use", 409)),
        }
      )
    ).resolves.toMatchObject({ formError: THEME_IN_USE_DELETE_ERROR })
  })

  it("maps authoritative validation pointers back to current controls", async () => {
    await expect(
      submitCreateTheme(
        {
          code: "reeded",
          name: "Reeded",
          idempotencyKey: "attempt-1",
        },
        {
          createTheme: vi.fn().mockRejectedValue(
            problem("theme_validation_failed", 422, [
              { name: "/code", code: "theme_code_required" },
              { name: "/name", code: "theme_name_too_long" },
            ])
          ),
        }
      )
    ).resolves.toMatchObject({
      fieldErrors: {
        code: "Theme Code cannot be blank.",
        name: "Theme Name must be 255 characters or fewer.",
      },
    })
  })
})
