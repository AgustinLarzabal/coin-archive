import { describe, expect, it } from "vitest"

import {
  createThemeAuthorizationError,
  hasThemeMaintenanceAccess,
  THEME_AUTHORIZATION_ERROR,
} from "./theme-maintenance"

describe("createThemeAuthorizationError", () => {
  it("returns the Theme authorization error result", () => {
    expect(createThemeAuthorizationError()).toStrictEqual({
      status: "error",
      formError: THEME_AUTHORIZATION_ERROR,
    })
  })
})

describe("hasThemeMaintenanceAccess", () => {
  it("rejects signed-out and non-editor Collectors", () => {
    expect(hasThemeMaintenanceAccess(null)).toBe(false)
    expect(hasThemeMaintenanceAccess({ role: "collector" })).toBe(false)
    expect(hasThemeMaintenanceAccess({ role: null })).toBe(false)
    expect(hasThemeMaintenanceAccess({ role: "owner" })).toBe(false)
  })

  it("allows Editors and Admins", () => {
    expect(hasThemeMaintenanceAccess({ role: "editor" })).toBe(true)
    expect(hasThemeMaintenanceAccess({ role: "admin" })).toBe(true)
  })
})
