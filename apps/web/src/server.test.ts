import { afterEach, describe, expect, it, vi } from "vitest"

const requiredSettingNames = [
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
  "DATABASE_URL",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "R2_ACCESS_KEY_ID",
  "R2_BUCKET",
  "R2_ENDPOINT",
  "R2_PUBLIC_BASE_URL",
  "R2_SECRET_ACCESS_KEY",
]

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
    ).rejects.toThrow(
      "Missing required runtime configuration: BETTER_AUTH_SECRET, BETTER_AUTH_URL, DATABASE_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, R2_ACCESS_KEY_ID, R2_BUCKET, R2_ENDPOINT, R2_PUBLIC_BASE_URL, R2_SECRET_ACCESS_KEY."
    )
  })
})
