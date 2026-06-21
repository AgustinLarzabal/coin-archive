import { describe, expect, it } from "vitest"

import { getCollectorRole } from "./collector-role"

describe("getCollectorRole", () => {
  it("returns null for signed-out Collectors and invalid Collector Role values", () => {
    expect(getCollectorRole(null)).toBeNull()
    expect(getCollectorRole({ role: null })).toBeNull()
    expect(getCollectorRole({ role: undefined })).toBeNull()
    expect(getCollectorRole({ role: "owner" })).toBeNull()
  })

  it("returns the normalized Collector Role for signed-in Collectors", () => {
    expect(getCollectorRole({ role: "collector" })).toBe("collector")
    expect(getCollectorRole({ role: "editor" })).toBe("editor")
    expect(getCollectorRole({ role: "admin" })).toBe("admin")
  })
})
