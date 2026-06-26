import { describe, expect, expectTypeOf, it } from "vitest"

import type { IssuerMaintenanceRecord } from "./get-issuer-maintenance-records"

describe("IssuerMaintenanceRecord", () => {
  it("includes optional parent issuer context for maintenance views", () => {
    expectTypeOf<IssuerMaintenanceRecord>().toMatchTypeOf<{
      id: string
      code: string
      isoCode: string
      name: string
      parent:
        | {
            id: string
            code: string
            name: string
          }
        | null
    }>()

    expect(true).toBe(true)
  })
})
