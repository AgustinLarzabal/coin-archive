import { afterEach, describe, expect, it, vi } from "vitest"

const requiredSettingNames = ["DATABASE_URL"]

describe("Cloudflare Worker entry point", () => {
  afterEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
  })

  it("rejects requests with a clear error when Worker configuration is missing", async () => {
    for (const name of requiredSettingNames) {
      vi.stubEnv(name, " \t ")
    }

    const { default: worker } = await import("./server")

    const fetchRequest = () =>
      worker.fetch(new Request("https://coinarchive.app/"))

    await expect(fetchRequest()).rejects.toThrow(
      "Missing required runtime configuration: DATABASE_URL."
    )
    await expect(fetchRequest()).rejects.not.toThrow(" \t ")
  })
})
