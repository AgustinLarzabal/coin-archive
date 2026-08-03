import { describe, expect, it, vi } from "vitest"

import { RULER_AUTHORIZATION_ERROR } from "./actions"
import { loadRulerMaintenancePageData } from "./ruler-maintenance-route-data"

const ruler = {
  id: "2f0b5ff0-f4a9-4333-8f6d-dad19cd8510b",
  code: "felipe-v",
  name: "Felipe V",
  group: null,
  version: 1,
  createdAt: "2026-08-03T00:00:00.000Z",
  updatedAt: "2026-08-03T00:00:00.000Z",
  etag: '"ruler-etag"',
}

describe("loadRulerMaintenancePageData", () => {
  it("loads all Ruler pages and Ruler Group options through the typed API", async () => {
    const listRulers = vi
      .fn()
      .mockResolvedValueOnce({ data: [ruler], nextCursor: "next" })
      .mockResolvedValueOnce({
        data: [{ ...ruler, id: "3f0b5ff0-f4a9-4333-8f6d-dad19cd8510c" }],
        nextCursor: null,
      })
    const group = {
      id: "6f18a1db-9096-433b-b3f1-906c772f7a29",
      code: "house-of-bourbon",
      name: "House of Bourbon",
    }
    const listRulerGroups = vi.fn().mockResolvedValue({
      data: [group],
      nextCursor: null,
    })

    await expect(
      loadRulerMaintenancePageData({ listRulers, listRulerGroups })
    ).resolves.toStrictEqual({
      status: "success",
      rulers: [ruler, { ...ruler, id: "3f0b5ff0-f4a9-4333-8f6d-dad19cd8510c" }],
      rulerGroups: [group],
    })
    expect(listRulers).toHaveBeenNthCalledWith(2, {
      cursor: "next",
      limit: 100,
      sort: "name",
      order: "asc",
    })
  })

  it("maps protected API authorization failures to the page result", async () => {
    const error = {
      data: { body: { code: "editor_access_required" } },
    }

    await expect(
      loadRulerMaintenancePageData({
        listRulers: vi.fn().mockRejectedValue(error),
        listRulerGroups: vi.fn(),
      })
    ).resolves.toStrictEqual({
      status: "error",
      formError: RULER_AUTHORIZATION_ERROR,
    })
  })

  it("rejects a repeated pagination cursor", async () => {
    const listRulers = vi
      .fn()
      .mockResolvedValue({ data: [ruler], nextCursor: "same" })

    await expect(
      loadRulerMaintenancePageData({
        listRulers,
        listRulerGroups: vi.fn(),
      })
    ).rejects.toThrow("Ruler maintenance API repeated a cursor.")
  })
})
