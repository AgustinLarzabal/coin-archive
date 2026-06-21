import { describe, expect, it } from "vitest"

import {
  collectorRoleValues,
  hasAdminAccess,
  hasEditorAccess,
  isCollectorRole,
} from "./roles"

describe("collector roles", () => {
  it("exports the supported collector role values", () => {
    expect(collectorRoleValues).toEqual(["collector", "editor", "admin"])
  })

  it("exposes role guards for future route protection", () => {
    expect(isCollectorRole("collector")).toBe(true)
    expect(isCollectorRole("editor")).toBe(true)
    expect(isCollectorRole("admin")).toBe(true)
    expect(isCollectorRole("owner")).toBe(false)
    expect(hasEditorAccess("collector")).toBe(false)
    expect(hasEditorAccess("editor")).toBe(true)
    expect(hasEditorAccess("admin")).toBe(true)
    expect(hasAdminAccess("editor")).toBe(false)
    expect(hasAdminAccess("admin")).toBe(true)
  })
})
