import { afterEach, describe, expect, it, vi } from "vitest"
import { getPublicApiBaseUrl, getPublicApiClient } from "./public-api.server"

const { createPublicApiClient } = vi.hoisted(() => ({
  createPublicApiClient: vi.fn(),
}))

vi.mock("@coin-archive/api", () => ({ createPublicApiClient }))

describe("getPublicApiClient", () => {
  afterEach(() => {
    createPublicApiClient.mockReset()
    vi.unstubAllGlobals()
  })

  it("binds the Worker fetch implementation before passing it to oRPC", async () => {
    const workerGlobal = globalThis
    const workerFetch = vi.fn(function (this: unknown) {
      if (this !== workerGlobal) {
        throw new TypeError("Illegal invocation")
      }
      return Promise.resolve(new Response())
    })
    vi.stubGlobal("fetch", workerFetch)

    getPublicApiClient()

    const options = createPublicApiClient.mock.calls[0]?.[0] as {
      fetch: typeof fetch
    }
    await expect(
      options.fetch.call({}, new Request("https://api.example.test"))
    ).resolves.toBeInstanceOf(Response)
  })
})

describe("getPublicApiBaseUrl", () => {
  it("uses an explicit local debugging target before the deployed environment", () => {
    expect(
      getPublicApiBaseUrl({
        CLOUDFLARE_ENV: "production",
        PUBLIC_API_BASE_URL: " http://127.0.0.1:8787 ",
      })
    ).toBe("http://127.0.0.1:8787")
  })

  it.each([
    ["staging", "https://api.staging.coinarchive.app"],
    ["production", "https://api.coinarchive.app"],
    [undefined, "http://127.0.0.1:8787"],
  ])("selects the %s API target", (environment, expectedBaseUrl) => {
    expect(getPublicApiBaseUrl({ CLOUDFLARE_ENV: environment })).toBe(
      expectedBaseUrl
    )
  })
})
