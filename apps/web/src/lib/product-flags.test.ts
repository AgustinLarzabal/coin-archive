import { afterEach, describe, expect, it, vi } from "vitest"

import { getProductFlags } from "./product-flags"

describe("getProductFlags", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("uses the shared default when the public override is absent", () => {
    expect(getProductFlags().showSignInButton).toBe(true)
  })

  it("uses the shared default when the public override is malformed", () => {
    vi.stubEnv("VITE_SHOW_SIGN_IN_BUTTON", "disabled")

    expect(getProductFlags().showSignInButton).toBe(true)
  })

  it("disables the header sign-in button for a false public override", () => {
    vi.stubEnv("VITE_SHOW_SIGN_IN_BUTTON", "false")

    expect(getProductFlags().showSignInButton).toBe(false)
  })
})
