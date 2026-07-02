import { describe, expect, it } from "vitest"

import {
  MINTING_TECHNIQUE_AUTHORIZATION_ERROR,
  createMintingTechniqueAuthorizationError,
  hasMintingTechniqueMaintenanceAccess,
} from "./minting-technique-maintenance"

describe("createMintingTechniqueAuthorizationError", () => {
  it("returns the Minting Technique authorization error result", () => {
    expect(createMintingTechniqueAuthorizationError()).toStrictEqual({
      status: "error",
      formError: MINTING_TECHNIQUE_AUTHORIZATION_ERROR,
    })
  })
})

describe("hasMintingTechniqueMaintenanceAccess", () => {
  it("rejects signed-out and non-editor Collectors", () => {
    expect(hasMintingTechniqueMaintenanceAccess(null)).toBe(false)
    expect(hasMintingTechniqueMaintenanceAccess({ role: "collector" })).toBe(
      false
    )
    expect(hasMintingTechniqueMaintenanceAccess({ role: null })).toBe(false)
    expect(hasMintingTechniqueMaintenanceAccess({ role: "owner" })).toBe(false)
  })

  it("allows Editors and Admins", () => {
    expect(hasMintingTechniqueMaintenanceAccess({ role: "editor" })).toBe(true)
    expect(hasMintingTechniqueMaintenanceAccess({ role: "admin" })).toBe(true)
  })
})
