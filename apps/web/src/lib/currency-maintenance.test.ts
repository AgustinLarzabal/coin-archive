import { describe, expect, it } from "vitest"

import { hasCurrencyMaintenanceAccess } from "./currency-maintenance"

describe("hasCurrencyMaintenanceAccess", () => {
  it("rejects signed-out and non-editor Collectors", () => {
    expect(hasCurrencyMaintenanceAccess(null)).toBe(false)
    expect(hasCurrencyMaintenanceAccess({ role: "collector" })).toBe(false)
    expect(hasCurrencyMaintenanceAccess({ role: null })).toBe(false)
    expect(hasCurrencyMaintenanceAccess({ role: "owner" })).toBe(false)
  })

  it("allows Editors and Admins", () => {
    expect(hasCurrencyMaintenanceAccess({ role: "editor" })).toBe(true)
    expect(hasCurrencyMaintenanceAccess({ role: "admin" })).toBe(true)
  })
})
