import { describe, expect, it, vi } from "vitest"

import { loadLocalEnvironmentFile } from "./env"

describe("loadLocalEnvironmentFile", () => {
  it("does nothing when the Worker runtime does not provide Node environment-file loading", () => {
    expect(() => loadLocalEnvironmentFile(undefined)).not.toThrow()
  })

  it("loads the repository local environment file when Node provides the loader", () => {
    const loadEnvironmentFile = vi.fn()

    loadLocalEnvironmentFile(loadEnvironmentFile)

    expect(String(loadEnvironmentFile.mock.calls[0]![0])).toBe(
      new URL("../../../.env", import.meta.url).toString()
    )
  })
})
