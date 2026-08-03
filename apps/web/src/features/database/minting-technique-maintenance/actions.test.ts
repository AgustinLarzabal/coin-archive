import { describe, expect, it, vi } from "vitest"

import {
  MINTING_TECHNIQUE_AUTHORIZATION_ERROR,
  submitCreateMintingTechnique,
  submitDeleteMintingTechnique,
  submitUpdateMintingTechnique,
} from "./actions"
import {
  MINTING_TECHNIQUE_DUPLICATE_CODE_ERROR,
  MINTING_TECHNIQUE_IN_USE_DELETE_ERROR,
  MINTING_TECHNIQUE_STALE_ERROR,
} from "./minting-technique-mutation-errors"

const id = "2c717ddb-95a2-4dad-a280-f58a4779aee8"
const etag = '"opaque-version"'
const mintingTechnique = {
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
        instance: "/api/v1/maintenance/minting-techniques",
        code,
        ...(invalidParams === undefined ? {} : { invalidParams }),
      },
    },
  }
}

describe("MintingTechnique web mutation adapter", () => {
  it("leaves authoritative validation to the typed API", async () => {
    const createMintingTechnique = vi.fn().mockRejectedValue(
      problem("minting_technique_validation_failed", 422, [
        { name: "/code", code: "minting_technique_code_required" },
        { name: "/name", code: "minting_technique_name_too_long" },
      ])
    )

    await expect(
      submitCreateMintingTechnique(
        {
          code: " ",
          name: "".padStart(256, "A"),
          idempotencyKey: "attempt-1",
        },
        { createMintingTechnique }
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        code: "Minting Technique Code cannot be blank.",
        name: "Minting Technique Name must be 255 characters or fewer.",
      },
    })
    expect(createMintingTechnique).toHaveBeenCalledWith({
      headers: { "idempotency-key": "attempt-1" },
      body: { code: " ", name: "".padStart(256, "A") },
    })
  })

  it("creates through the typed API with a client-owned idempotency key", async () => {
    const createMintingTechnique = vi.fn(async () => ({
      status: 201 as const,
      headers: {
        etag,
        location: `/api/v1/maintenance/minting-techniques/${id}`,
      },
      body: { data: mintingTechnique },
    }))

    await expect(
      submitCreateMintingTechnique(
        {
          code: " reeded ",
          name: " Reeded ",
          idempotencyKey: "attempt-1",
        },
        { createMintingTechnique }
      )
    ).resolves.toStrictEqual({
      status: "success",
      message: "Minting Technique added.",
    })
    expect(createMintingTechnique).toHaveBeenCalledWith({
      headers: { "idempotency-key": "attempt-1" },
      body: { code: " reeded ", name: " Reeded " },
    })
  })

  it("reuses the caller-owned idempotency key when a create is retried", async () => {
    const createMintingTechnique = vi.fn(async () => ({
      status: 201 as const,
      headers: {
        etag,
        location: `/api/v1/maintenance/minting-techniques/${id}`,
      },
      body: { data: mintingTechnique },
    }))
    const submission = {
      code: "reeded",
      name: "Reeded",
      idempotencyKey: "stable-attempt",
    }

    await submitCreateMintingTechnique(submission, { createMintingTechnique })
    await submitCreateMintingTechnique(submission, { createMintingTechnique })

    expect(createMintingTechnique).toHaveBeenCalledTimes(2)
    expect(createMintingTechnique).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        headers: { "idempotency-key": "stable-attempt" },
      })
    )
    expect(createMintingTechnique).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        headers: { "idempotency-key": "stable-attempt" },
      })
    )
  })

  it("submits the retained opaque ETag for replacement and deletion", async () => {
    const replaceMintingTechnique = vi.fn(async () => ({
      status: 200 as const,
      headers: { etag: '"next-version"' },
      body: {
        data: { ...mintingTechnique, version: 2, etag: '"next-version"' },
      },
    }))
    const deleteMintingTechnique = vi.fn(async () => ({ status: 204 as const }))

    await expect(
      submitUpdateMintingTechnique(
        { id, etag, code: "plain", name: "Plain" },
        { replaceMintingTechnique }
      )
    ).resolves.toMatchObject({ status: "success", message: "Saved." })
    await expect(
      submitDeleteMintingTechnique({ id, etag }, { deleteMintingTechnique })
    ).resolves.toMatchObject({
      status: "success",
      message: "Minting Technique deleted.",
    })

    expect(replaceMintingTechnique).toHaveBeenCalledWith({
      params: { uuid: id },
      headers: { "if-match": etag },
      body: { code: "plain", name: "Plain" },
    })
    expect(deleteMintingTechnique).toHaveBeenCalledWith({
      params: { uuid: id },
      headers: { "if-match": etag },
    })
  })

  it("maps API authorization, duplicate, stale, and dependency problems", async () => {
    await expect(
      submitCreateMintingTechnique(
        {
          code: "reeded",
          name: "Reeded",
          idempotencyKey: "attempt-1",
        },
        {
          createMintingTechnique: vi
            .fn()
            .mockRejectedValue(problem("editor_access_required", 403)),
        }
      )
    ).resolves.toMatchObject({
      formError: MINTING_TECHNIQUE_AUTHORIZATION_ERROR,
    })

    await expect(
      submitCreateMintingTechnique(
        {
          code: "reeded",
          name: "Reeded",
          idempotencyKey: "attempt-1",
        },
        {
          createMintingTechnique: vi
            .fn()
            .mockRejectedValue(problem("minting_technique_code_conflict", 409)),
        }
      )
    ).resolves.toMatchObject({
      fieldErrors: { code: MINTING_TECHNIQUE_DUPLICATE_CODE_ERROR },
    })

    await expect(
      submitUpdateMintingTechnique(
        { id, etag, code: "reeded", name: "Reeded" },
        {
          replaceMintingTechnique: vi
            .fn()
            .mockRejectedValue(
              problem("minting_technique_precondition_failed", 412)
            ),
        }
      )
    ).resolves.toMatchObject({ formError: MINTING_TECHNIQUE_STALE_ERROR })

    await expect(
      submitDeleteMintingTechnique(
        { id, etag },
        {
          deleteMintingTechnique: vi
            .fn()
            .mockRejectedValue(problem("minting_technique_in_use", 409)),
        }
      )
    ).resolves.toMatchObject({
      formError: MINTING_TECHNIQUE_IN_USE_DELETE_ERROR,
    })
  })

  it("maps authoritative validation pointers back to current controls", async () => {
    await expect(
      submitCreateMintingTechnique(
        {
          code: "reeded",
          name: "Reeded",
          idempotencyKey: "attempt-1",
        },
        {
          createMintingTechnique: vi.fn().mockRejectedValue(
            problem("minting_technique_validation_failed", 422, [
              { name: "/code", code: "minting_technique_code_required" },
              { name: "/name", code: "minting_technique_name_too_long" },
            ])
          ),
        }
      )
    ).resolves.toMatchObject({
      fieldErrors: {
        code: "Minting Technique Code cannot be blank.",
        name: "Minting Technique Name must be 255 characters or fewer.",
      },
    })
  })
})
