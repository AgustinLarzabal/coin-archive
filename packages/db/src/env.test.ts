import { describe, expect, it, vi } from "vitest"

import { loadLocalEnvironmentFile } from "./env"

describe("loadLocalEnvironmentFile", () => {
  it("does nothing when the Worker runtime does not provide Node environment-file loading", () => {
    expect(() => loadLocalEnvironmentFile(undefined)).not.toThrow()
  })

  it("does not resolve a local file path in a Worker module", () => {
    const loadEnvironmentFile = vi.fn()

    loadLocalEnvironmentFile(loadEnvironmentFile, "cloudflare:worker")

    expect(loadEnvironmentFile).not.toHaveBeenCalled()
  })

  it("does not resolve a local file path when the bundled module has no URL", () => {
    const loadEnvironmentFile = vi.fn()

    loadLocalEnvironmentFile(loadEnvironmentFile, null)

    expect(loadEnvironmentFile).not.toHaveBeenCalled()
  })

  it("loads the repository local environment file when Node provides the loader", () => {
    const loadEnvironmentFile = vi.fn()

    loadLocalEnvironmentFile(loadEnvironmentFile)

    expect(String(loadEnvironmentFile.mock.calls[0]![0])).toBe(
      new URL("../../../.env", import.meta.url).toString()
    )
  })
})
