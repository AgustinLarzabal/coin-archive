import type { Issuer } from "@coin-archive/api"
import { describe, expect, it, vi } from "vitest"

import { ISSUER_AUTHORIZATION_ERROR } from "./actions"
import { loadIssuerMaintenancePageData } from "./issuer-maintenance-route-data"

const issuers: Issuer[] = [
  {
    id: "2c717ddb-95a2-4dad-a280-f58a4779aee8",
    code: "reeded",
    isoCode: "AR",
    name: "Reeded",
    parentIssuerId: null,
    version: 1,
    createdAt: "2026-08-02T10:15:30.000Z",
    updatedAt: "2026-08-02T10:15:30.000Z",
    etag: '"issuer-version-1"',
  },
  {
    id: "98474ec9-cb4c-44c3-b876-6b1790190dd5",
    code: "plain",
    isoCode: "IT",
    name: "Plain",
    parentIssuerId: "2c717ddb-95a2-4dad-a280-f58a4779aee8",
    version: 1,
    createdAt: "2026-08-02T10:15:30.000Z",
    updatedAt: "2026-08-02T10:15:30.000Z",
    etag: '"issuer-version-1"',
  },
]

describe("loadIssuerMaintenancePageData", () => {
  it.each(["authentication_required", "editor_access_required"])(
    "maps API %s problems to the current access-denied presentation",
    async (code) => {
      const listIssuers = vi.fn().mockRejectedValue({
        data: { body: { code } },
      })

      await expect(
        loadIssuerMaintenancePageData({ listIssuers })
      ).resolves.toStrictEqual({
        status: "error",
        formError: ISSUER_AUTHORIZATION_ERROR,
      })
    }
  )

  it("loads every cursor page through the typed maintenance client", async () => {
    const listIssuers = vi
      .fn()
      .mockResolvedValueOnce({ data: [issuers[0]], nextCursor: "next" })
      .mockResolvedValueOnce({ data: [issuers[1]], nextCursor: null })

    await expect(
      loadIssuerMaintenancePageData({ listIssuers })
    ).resolves.toStrictEqual({
      status: "success",
      issuers: [
        expect.objectContaining({ id: issuers[0].id, parent: null }),
        expect.objectContaining({
          id: issuers[1].id,
          parent: {
            id: issuers[0].id,
            code: issuers[0].code,
            name: issuers[0].name,
          },
        }),
      ],
    })
    expect(listIssuers).toHaveBeenNthCalledWith(1, {
      limit: 100,
      sort: "name",
      order: "asc",
    })
    expect(listIssuers).toHaveBeenNthCalledWith(2, {
      cursor: "next",
      limit: 100,
      sort: "name",
      order: "asc",
    })
  })

  it("does not hide unexpected API failures as authorization failures", async () => {
    const failure = new Error("API unavailable")

    await expect(
      loadIssuerMaintenancePageData({
        listIssuers: vi.fn().mockRejectedValue(failure),
      })
    ).rejects.toBe(failure)
  })
})
