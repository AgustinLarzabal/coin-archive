import { afterEach, describe, expect, it, vi } from "vitest"
import { getPublicApiClient } from "./public-api.server"

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
