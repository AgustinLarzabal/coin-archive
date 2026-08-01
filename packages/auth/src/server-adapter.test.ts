import { beforeEach, describe, expect, it, vi } from "vitest"

import { setAuthTestEnvironment } from "./test-environment"

const drizzleAdapterMock = vi.fn(() => ({ id: "drizzle-adapter-mock" }))
const betterAuthMock = vi.fn((options: unknown) => ({ options }))

vi.mock("better-auth", () => ({
  betterAuth: betterAuthMock,
}))

vi.mock("better-auth/adapters/drizzle", () => ({
  drizzleAdapter: drizzleAdapterMock,
}))

describe("Better Auth drizzle adapter configuration", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    setAuthTestEnvironment()
  })

  it("passes the auth tables directly to the drizzle adapter schema", async () => {
    const dbModule = await import("@coin-archive/db")

    const { auth } = await import("./server")

    void auth.options

    expect(drizzleAdapterMock).toHaveBeenCalledTimes(1)
    expect(drizzleAdapterMock).toHaveBeenCalledWith(
      dbModule.db,
      expect.objectContaining({
        provider: "pg",
        schema: expect.objectContaining({
          account: dbModule.account,
          session: dbModule.session,
          user: dbModule.user,
          verification: dbModule.verification,
        }),
      })
    )
  })
})
