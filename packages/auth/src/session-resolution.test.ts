import { beforeEach, describe, expect, it, vi } from "vitest"
import type * as MemoryAdapterModule from "better-auth/adapters/memory"

import { setAuthTestEnvironment } from "./test-environment"

const memoryDatabase = vi.hoisted(() => ({
  account: [],
  session: [] as Array<Record<string, unknown>>,
  user: [] as Array<Record<string, unknown>>,
  verification: [],
}))

vi.mock("better-auth/adapters/drizzle", async () => {
  const { memoryAdapter } = await vi.importActual<typeof MemoryAdapterModule>(
    "better-auth/adapters/memory"
  )

  return { drizzleAdapter: () => memoryAdapter(memoryDatabase) }
})

describe("API-hosted Better Auth session resolution", () => {
  beforeEach(() => {
    vi.resetModules()
    setAuthTestEnvironment()
    memoryDatabase.session.length = 0
    memoryDatabase.user.length = 0
  })

  it("resolves the current server-owned Collector Role and rejects invalid sessions", async () => {
    const now = new Date()
    const collector = {
      id: "collector-id",
      name: "Collector",
      email: "collector@example.test",
      emailVerified: true,
      image: null,
      role: "collector",
      createdAt: now,
      updatedAt: now,
    }
    const sessionToken = "server-session-token"
    memoryDatabase.user.push(collector)
    memoryDatabase.session.push({
      id: "session-id",
      userId: collector.id,
      token: sessionToken,
      expiresAt: new Date(now.getTime() + 60_000),
      ipAddress: null,
      userAgent: null,
      createdAt: now,
      updatedAt: now,
    })

    const { auth } = await import("./server")
    const validCookie = await signedSessionCookie(sessionToken, "test-secret")
    const first = await resolveSession(auth.handler, validCookie)

    expect(first).toMatchObject({ user: { role: "collector" } })

    collector.role = "admin"
    const second = await resolveSession(auth.handler, validCookie)
    expect(second).toMatchObject({ user: { role: "admin" } })

    const invalid = await resolveSession(
      auth.handler,
      await signedSessionCookie("invalid-token", "test-secret")
    )
    expect(invalid).toBeNull()
  })
})

async function resolveSession(
  handler: (request: Request) => Promise<Response>,
  cookie: string
) {
  const response = await handler(
    new Request("http://127.0.0.1:8787/api/auth/get-session", {
      headers: { Cookie: cookie },
    })
  )

  expect(response.status).toBe(200)
  return response.json()
}

async function signedSessionCookie(token: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(token)
  )
  const encodedSignature = btoa(
    String.fromCharCode(...new Uint8Array(signature))
  )

  return `better-auth.session_token=${token}.${encodedSignature}`
}
