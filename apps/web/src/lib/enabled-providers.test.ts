import { afterEach, describe, expect, it, vi } from "vitest"

import { getEnabledProviders } from "./enabled-providers"

describe("getEnabledProviders", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("includes Google when the Vite flag is enabled", () => {
    vi.stubEnv("VITE_AUTH_GOOGLE_ENABLED", "true")

    expect(getEnabledProviders()).toEqual(["google"])
  })

  it("omits Google when the Vite flag is disabled", () => {
    vi.stubEnv("VITE_AUTH_GOOGLE_ENABLED", "false")

    expect(getEnabledProviders()).toEqual([])
  })
})
