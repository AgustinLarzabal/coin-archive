import { describe, expect, it, vi } from "vitest"

import { loadAllMaintenanceOptions } from "./maintenance-options"

describe("loadAllMaintenanceOptions", () => {
  it("loads every compact maintenance option page", async () => {
    const first = {
      id: "2c717ddb-95a2-4dad-a280-f58a4779aee8",
      code: "silver",
      name: "Silver",
    }
    const second = {
      id: "98474ec9-cb4c-44c3-b876-6b1790190dd5",
      code: "gold",
      name: "Gold",
    }
    const listOptions = vi
      .fn()
      .mockResolvedValueOnce({ data: [first], nextCursor: "next" })
      .mockResolvedValueOnce({ data: [second], nextCursor: null })

    await expect(loadAllMaintenanceOptions(listOptions)).resolves.toStrictEqual(
      [first, second]
    )
    expect(listOptions).toHaveBeenNthCalledWith(1, { limit: 100 })
    expect(listOptions).toHaveBeenNthCalledWith(2, {
      cursor: "next",
      limit: 100,
    })
  })

  it("propagates typed-client failures", async () => {
    const failure = { code: "FORBIDDEN" }

    await expect(
      loadAllMaintenanceOptions(vi.fn().mockRejectedValue(failure))
    ).rejects.toBe(failure)
  })
})
