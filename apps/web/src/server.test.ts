import { afterEach, describe, expect, it, vi } from "vitest"

const requiredSettingNames = ["DATABASE_URL"]

describe("Cloudflare Worker entry point", () => {
  afterEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
  })

  it("rejects requests with a clear error when Worker configuration is missing", async () => {
    for (const name of requiredSettingNames) {
      vi.stubEnv(name, "")
    }

    const { default: worker } = await import("./server")

    await expect(
      worker.fetch(new Request("https://coinarchive.app/"))
    ).rejects.toThrow("Missing required runtime configuration: DATABASE_URL.")
  })
})
