import { describe, expect, it, vi } from "vitest"

const { handler } = vi.hoisted(() => ({
  handler: vi.fn(async (request: Request) => {
    return new Response(`handled ${new URL(request.url).pathname}`, {
      status: 200,
    })
  }),
}))

vi.mock("@workspace/auth/server", () => ({
  auth: {
    handler,
  },
}))

describe("handleAuthRequest", () => {
  it("delegates same-origin auth requests to Better Auth", async () => {
    const { handleAuthRequest } = await import("./$")

    const request = new Request("http://localhost:3000/api/auth/sign-in/social")
    const response = await handleAuthRequest({ request })

    expect(handler).toHaveBeenCalledWith(request)
    expect(response.status).toBe(200)
    expect(await response.text()).toBe("handled /api/auth/sign-in/social")
  })
})
