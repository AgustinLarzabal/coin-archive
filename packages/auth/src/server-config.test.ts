import { describe, expect, it } from "vitest"

import { setAuthTestEnvironment } from "./test-environment"

describe("Better Auth server configuration", () => {
  it("trusts only the configured web and API origins behind the web proxy", async () => {
    setAuthTestEnvironment()

    const { auth } = await import("./server")

    expect(auth.options.trustedOrigins).toEqual([
      "http://127.0.0.1:8787",
      "http://localhost:3000",
    ])
    expect(auth.options.baseURL).toEqual({
      allowedHosts: ["127.0.0.1:8787", "localhost:3000"],
      fallback: "http://127.0.0.1:8787",
      protocol: "auto",
    })
    expect(auth.options.advanced).toMatchObject({ trustedProxyHeaders: true })
    expect(auth.options.advanced).toMatchObject({ useSecureCookies: false })
  })

  it("configures the collector role field with a default and disallows user input", async () => {
    setAuthTestEnvironment()

    const { auth, collectorRoleValues } = await import("./server")

    expect(auth.options.user.additionalFields.role).toMatchObject({
      type: collectorRoleValues,
      defaultValue: "collector",
      input: false,
    })
    expect(auth.options.session.cookieCache).toMatchObject({ enabled: false })
  })

  it("configures Google as the initial social sign-in provider", async () => {
    setAuthTestEnvironment()

    const { auth } = await import("./server")

    expect(auth.options.socialProviders).toMatchObject({
      google: {
        clientId: "test-google-client-id",
        clientSecret: "test-google-client-secret",
      },
    })
  })

  it("uses secure cookies explicitly for deployed HTTPS auth origins", async () => {
    setAuthTestEnvironment()

    const { db } = await import("@coin-archive/db")
    const { createAuth } = await import("./server")
    const deployedAuth = createAuth({
      database: db,
      environment: {
        betterAuthSecret: "test-secret",
        betterAuthUrl: "https://api.coinarchive.app",
        trustedOrigins: ["https://coinarchive.app"],
        googleClientId: "test-google-client-id",
        googleClientSecret: "test-google-client-secret",
      },
    })

    expect(deployedAuth.options.advanced.useSecureCookies).toBe(true)
  })

  it("rejects authentication mutations from an untrusted origin", async () => {
    setAuthTestEnvironment()

    const { auth } = await import("./server")
    const response = await auth.handler(
      new Request("http://127.0.0.1:8787/api/auth/sign-out", {
        method: "POST",
        headers: {
          Cookie: "better-auth.session_token=invalid-session",
          Origin: "https://attacker.example",
        },
      })
    )

    expect(response.status).toBe(403)
  })
})
