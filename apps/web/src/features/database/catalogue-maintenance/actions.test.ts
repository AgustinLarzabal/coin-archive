import { describe, expect, it, vi } from "vitest"

import {
  CATALOGUE_AUTHORIZATION_ERROR,
  submitCreateCatalogue,
  submitDeleteCatalogue,
  submitUpdateCatalogue,
} from "./actions"
import {
  CATALOGUE_DUPLICATE_CODE_ERROR,
  CATALOGUE_IN_USE_DELETE_ERROR,
  CATALOGUE_STALE_ERROR,
} from "./catalogue-mutation-errors"

const id = "2c717ddb-95a2-4dad-a280-f58a4779aee8"
const etag = '"opaque-version"'
const catalogue = {
  id,
  code: "KM",
  title: "Standard Catalog of World Coins",
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
        instance: "/api/v1/maintenance/catalogues",
        code,
        ...(invalidParams === undefined ? {} : { invalidParams }),
      },
    },
  }
}

describe("Catalogue web mutation adapter", () => {
  it("retains client validation before calling the typed create operation", async () => {
    const createCatalogue = vi.fn()

    await expect(
      submitCreateCatalogue(
        {
          code: " ",
          title: "".padStart(256, "A"),
          idempotencyKey: "attempt-1",
        },
        { createCatalogue }
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: "Catalogue Code cannot be blank.",
        title: "Catalogue Title must be 255 characters or fewer.",
      },
    })
    expect(createCatalogue).not.toHaveBeenCalled()
  })

  it("creates through the typed API with a client-owned idempotency key", async () => {
    const createCatalogue = vi.fn(async () => ({
      status: 201 as const,
      headers: { etag, location: `/api/v1/maintenance/catalogues/${id}` },
      body: { data: catalogue },
    }))

    await expect(
      submitCreateCatalogue(
        {
          code: " KM ",
          title: " Standard Catalog of World Coins ",
          idempotencyKey: "attempt-1",
        },
        { createCatalogue }
      )
    ).resolves.toStrictEqual({
      status: "success",
      message: "Catalogue added.",
    })
    expect(createCatalogue).toHaveBeenCalledWith({
      headers: { "idempotency-key": "attempt-1" },
      body: { code: "KM", title: "Standard Catalog of World Coins" },
    })
  })

  it("reuses the caller-owned idempotency key when a create is retried", async () => {
    const createCatalogue = vi.fn(async () => ({
      status: 201 as const,
      headers: { etag, location: `/api/v1/maintenance/catalogues/${id}` },
      body: { data: catalogue },
    }))
    const submission = {
      code: "KM",
      title: "Standard Catalog of World Coins",
      idempotencyKey: "stable-attempt",
    }

    await submitCreateCatalogue(submission, { createCatalogue })
    await submitCreateCatalogue(submission, { createCatalogue })

    expect(createCatalogue).toHaveBeenCalledTimes(2)
    expect(createCatalogue).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        headers: { "idempotency-key": "stable-attempt" },
      })
    )
    expect(createCatalogue).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        headers: { "idempotency-key": "stable-attempt" },
      })
    )
  })

  it("submits the retained opaque ETag for replacement and deletion", async () => {
    const replaceCatalogue = vi.fn(async () => ({
      status: 200 as const,
      headers: { etag: '"next-version"' },
      body: {
        data: { ...catalogue, version: 2, etag: '"next-version"' },
      },
    }))
    const deleteCatalogue = vi.fn(async () => ({ status: 204 as const }))

    await expect(
      submitUpdateCatalogue(
        { id, etag, code: "RIC", title: "Roman Imperial Coinage" },
        { replaceCatalogue }
      )
    ).resolves.toMatchObject({ status: "success", message: "Saved." })
    await expect(
      submitDeleteCatalogue({ id, etag }, { deleteCatalogue })
    ).resolves.toMatchObject({
      status: "success",
      message: "Catalogue deleted.",
    })

    expect(replaceCatalogue).toHaveBeenCalledWith({
      params: { uuid: id },
      headers: { "if-match": etag },
      body: { code: "RIC", title: "Roman Imperial Coinage" },
    })
    expect(deleteCatalogue).toHaveBeenCalledWith({
      params: { uuid: id },
      headers: { "if-match": etag },
    })
  })

  it("maps API authorization, duplicate, stale, and dependency problems", async () => {
    await expect(
      submitCreateCatalogue(
        {
          code: "KM",
          title: "Standard Catalog of World Coins",
          idempotencyKey: "attempt-1",
        },
        {
          createCatalogue: vi
            .fn()
            .mockRejectedValue(problem("editor_access_required", 403)),
        }
      )
    ).resolves.toMatchObject({ formError: CATALOGUE_AUTHORIZATION_ERROR })

    await expect(
      submitCreateCatalogue(
        {
          code: "KM",
          title: "Standard Catalog of World Coins",
          idempotencyKey: "attempt-1",
        },
        {
          createCatalogue: vi
            .fn()
            .mockRejectedValue(problem("catalogue_code_conflict", 409)),
        }
      )
    ).resolves.toMatchObject({
      fieldErrors: { code: CATALOGUE_DUPLICATE_CODE_ERROR },
    })

    await expect(
      submitUpdateCatalogue(
        { id, etag, code: "KM", title: "Standard Catalog of World Coins" },
        {
          replaceCatalogue: vi
            .fn()
            .mockRejectedValue(problem("catalogue_precondition_failed", 412)),
        }
      )
    ).resolves.toMatchObject({ formError: CATALOGUE_STALE_ERROR })

    await expect(
      submitDeleteCatalogue(
        { id, etag },
        {
          deleteCatalogue: vi
            .fn()
            .mockRejectedValue(problem("catalogue_in_use", 409)),
        }
      )
    ).resolves.toMatchObject({ formError: CATALOGUE_IN_USE_DELETE_ERROR })
  })

  it("maps authoritative validation pointers back to current controls", async () => {
    await expect(
      submitCreateCatalogue(
        {
          code: "KM",
          title: "Standard Catalog of World Coins",
          idempotencyKey: "attempt-1",
        },
        {
          createCatalogue: vi.fn().mockRejectedValue(
            problem("catalogue_validation_failed", 422, [
              { name: "/code", code: "catalogue_code_required" },
              { name: "/title", code: "catalogue_title_too_long" },
            ])
          ),
        }
      )
    ).resolves.toMatchObject({
      fieldErrors: {
        code: "Catalogue Code cannot be blank.",
        title: "Catalogue Title must be 255 characters or fewer.",
      },
    })
  })
})
