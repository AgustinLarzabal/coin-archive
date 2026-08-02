import { describe, expect, it, vi } from "vitest"

import {
  CURRENCY_AUTHORIZATION_ERROR,
  submitCreateCurrency,
  submitDeleteCurrency,
  submitUpdateCurrency,
} from "./actions"
import {
  CURRENCY_DUPLICATE_CODE_ERROR,
  CURRENCY_IN_USE_DELETE_ERROR,
  CURRENCY_STALE_ERROR,
} from "./currency-mutation-errors"

const id = "2c717ddb-95a2-4dad-a280-f58a4779aee8"
const etag = '"opaque-version"'
const currency = {
  id,
  code: "united-states-dollar",
  name: "Dollar",
  fullName: "United States dollar",
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
        instance: "/api/v1/maintenance/currencies",
        code,
        ...(invalidParams === undefined ? {} : { invalidParams }),
      },
    },
  }
}

describe("Currency web mutation adapter", () => {
  it("creates through the typed API with a client-owned idempotency key", async () => {
    const createCurrency = vi.fn(async () => ({
      status: 201 as const,
      headers: { etag, location: `/api/v1/maintenance/currencies/${id}` },
      body: { data: currency },
    }))

    await expect(
      submitCreateCurrency(
        {
          code: " united-states-dollar ",
          name: " Dollar ",
          fullName: " United States dollar ",
          idempotencyKey: "attempt-1",
        },
        { createCurrency }
      )
    ).resolves.toStrictEqual({
      status: "success",
      message: "Currency added.",
    })
    expect(createCurrency).toHaveBeenCalledWith({
      headers: { "idempotency-key": "attempt-1" },
      body: {
        code: " united-states-dollar ",
        name: " Dollar ",
        fullName: " United States dollar ",
      },
    })
  })

  it("reuses the caller-owned idempotency key when a create is retried", async () => {
    const createCurrency = vi.fn(async () => ({
      status: 201 as const,
      headers: { etag, location: `/api/v1/maintenance/currencies/${id}` },
      body: { data: currency },
    }))
    const submission = {
      code: "united-states-dollar",
      name: "Dollar",
      fullName: "United States dollar",
      idempotencyKey: "stable-attempt",
    }

    await submitCreateCurrency(submission, { createCurrency })
    await submitCreateCurrency(submission, { createCurrency })

    expect(createCurrency).toHaveBeenCalledTimes(2)
    expect(createCurrency).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        headers: { "idempotency-key": "stable-attempt" },
      })
    )
    expect(createCurrency).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        headers: { "idempotency-key": "stable-attempt" },
      })
    )
  })

  it("submits the retained opaque ETag for replacement and deletion", async () => {
    const replaceCurrency = vi.fn(async () => ({
      status: 200 as const,
      headers: { etag: '"next-version"' },
      body: {
        data: { ...currency, version: 2, etag: '"next-version"' },
      },
    }))
    const deleteCurrency = vi.fn(async () => ({ status: 204 as const }))

    await expect(
      submitUpdateCurrency(
        { id, etag, code: "euro", name: "Euro", fullName: "Euro" },
        { replaceCurrency }
      )
    ).resolves.toMatchObject({ status: "success", message: "Saved." })
    await expect(
      submitDeleteCurrency({ id, etag }, { deleteCurrency })
    ).resolves.toMatchObject({
      status: "success",
      message: "Currency deleted.",
    })

    expect(replaceCurrency).toHaveBeenCalledWith({
      params: { uuid: id },
      headers: { "if-match": etag },
      body: { code: "euro", name: "Euro", fullName: "Euro" },
    })
    expect(deleteCurrency).toHaveBeenCalledWith({
      params: { uuid: id },
      headers: { "if-match": etag },
    })
  })

  it("maps API authorization, duplicate, stale, and dependency problems", async () => {
    await expect(
      submitCreateCurrency(
        {
          code: "silver",
          name: "Silver",
          fullName: "Silver",
          idempotencyKey: "attempt-1",
        },
        {
          createCurrency: vi
            .fn()
            .mockRejectedValue(problem("editor_access_required", 403)),
        }
      )
    ).resolves.toMatchObject({ formError: CURRENCY_AUTHORIZATION_ERROR })

    await expect(
      submitCreateCurrency(
        {
          code: "silver",
          name: "Silver",
          fullName: "Silver",
          idempotencyKey: "attempt-1",
        },
        {
          createCurrency: vi
            .fn()
            .mockRejectedValue(problem("currency_code_conflict", 409)),
        }
      )
    ).resolves.toMatchObject({
      fieldErrors: { code: CURRENCY_DUPLICATE_CODE_ERROR },
    })

    await expect(
      submitUpdateCurrency(
        { id, etag, code: "silver", name: "Silver", fullName: "Silver" },
        {
          replaceCurrency: vi
            .fn()
            .mockRejectedValue(problem("currency_precondition_failed", 412)),
        }
      )
    ).resolves.toMatchObject({ formError: CURRENCY_STALE_ERROR })

    await expect(
      submitDeleteCurrency(
        { id, etag },
        {
          deleteCurrency: vi
            .fn()
            .mockRejectedValue(problem("currency_in_use", 409)),
        }
      )
    ).resolves.toMatchObject({ formError: CURRENCY_IN_USE_DELETE_ERROR })
  })

  it("maps authoritative validation pointers back to current controls", async () => {
    await expect(
      submitCreateCurrency(
        {
          code: "silver",
          name: "Silver",
          fullName: "Silver",
          idempotencyKey: "attempt-1",
        },
        {
          createCurrency: vi.fn().mockRejectedValue(
            problem("currency_validation_failed", 422, [
              { name: "/code", code: "currency_code_required" },
              { name: "/name", code: "currency_name_too_long" },
              { name: "/fullName", code: "currency_full_name_required" },
            ])
          ),
        }
      )
    ).resolves.toMatchObject({
      fieldErrors: {
        code: "Currency Code cannot be blank.",
        name: "Currency Name must be 255 characters or fewer.",
        fullName: "Currency Full Name cannot be blank.",
      },
    })
  })
})
